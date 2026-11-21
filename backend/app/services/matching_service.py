import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from app.database.connection import get_database
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.services.similarity_service import compute_overall_match
from app.services.gemini_service import gemini_service
from app.services.notification_service import notification_service
from app.utils.text_preprocessing import build_searchable_representation
from app.utils.response_helpers import serialize_doc, serialize_docs
from app.core.config import settings

logger = logging.getLogger("findit.matching")

class MatchingService:
    @staticmethod
    async def match_item(item_id: str, item_type: str = "lost") -> List[Dict[str, Any]]:
        """
        Run matching pipeline for a newly created or updated item.
        - If item_type == 'lost', searches candidate active 'found' items.
        - If item_type == 'found', searches candidate active 'lost' items.
        """
        db = get_database()
        collection = db.lost_items if item_type == "lost" else db.found_items
        target_collection = db.found_items if item_type == "lost" else db.lost_items
        search_target_type = "found" if item_type == "lost" else "lost"

        source_doc = await collection.find_one({"_id": ObjectId(item_id)})
        if not source_doc:
            logger.warning(f"Item {item_id} not found for matching.")
            return []

        # 1. Preprocess & generate embedding
        searchable_text = build_searchable_representation(source_doc)
        vec = embedding_service.generate_embedding(searchable_text)
        
        # 2. Add to vector store
        vector_store.add_item(item_id, vec, item_type)

        # 3. Retrieve candidates via vector search
        candidates = vector_store.search(vec, search_target_type, top_k=25)
        
        matches_found = []
        for cand_id, semantic_sim in candidates:
            cand_doc = await target_collection.find_one({"_id": ObjectId(cand_id)})
            if not cand_doc:
                continue

            # Ensure candidate is active/available
            cand_status = cand_doc.get("status")
            if item_type == "lost" and cand_status not in ["available", "potential_match"]:
                continue
            if item_type == "found" and cand_status not in ["active", "potential_match"]:
                continue

            # Identify which is lost and which is found
            lost_doc = source_doc if item_type == "lost" else cand_doc
            found_doc = cand_doc if item_type == "lost" else source_doc
            lost_id_str = str(lost_doc["_id"])
            found_id_str = str(found_doc["_id"])

            # 4. Multi-attribute hybrid score calculation
            scores = compute_overall_match(lost_doc, found_doc, semantic_sim)
            final_score = scores["final_score"]

            # Filter: only record candidate matches that meet minimum viable threshold (>= 50)
            if final_score < 50.0:
                continue

            # 5. Generate AI match explanation for shortlisted candidates
            explanation = await gemini_service.generate_match_explanation(
                lost_title=lost_doc.get("title", ""),
                lost_desc=lost_doc.get("description", ""),
                lost_loc=lost_doc.get("location_lost", ""),
                found_title=found_doc.get("title", ""),
                found_desc=found_doc.get("description", ""),
                found_loc=found_doc.get("location_found", ""),
                score=final_score
            )

            # 6. Save or update match document in MongoDB
            match_doc = {
                "lost_item_id": lost_id_str,
                "found_item_id": found_id_str,
                "semantic_score": scores["semantic_score"],
                "category_score": scores["category_score"],
                "color_score": scores["color_score"],
                "brand_score": scores["brand_score"],
                "location_score": scores["location_score"],
                "temporal_score": scores["temporal_score"],
                "image_score": None,
                "final_score": final_score,
                "match_explanation": explanation,
                "match_status": scores["match_status"],
                "created_at": datetime.now(timezone.utc)
            }

            await db.matches.update_one(
                {"lost_item_id": lost_id_str, "found_item_id": found_id_str},
                {"$set": match_doc},
                upsert=True
            )

            # Update item statuses to potential_match if currently active/available
            if scores["match_status"] in ["high_potential", "possible_match"]:
                if lost_doc.get("status") == "active":
                    await db.lost_items.update_one({"_id": ObjectId(lost_id_str)}, {"$set": {"status": "potential_match"}})
                if found_doc.get("status") == "available":
                    await db.found_items.update_one({"_id": ObjectId(found_id_str)}, {"$set": {"status": "potential_match"}})

            # 7. Notify both users if high-potential match
            if scores["match_status"] == "high_potential":
                # Notify lost reporter
                lost_owner_id = str(lost_doc.get("user_id"))
                await notification_service.create_notification(
                    user_id=lost_owner_id,
                    title="Potential Match Found!",
                    message=f"An item matching your lost '{lost_doc.get('title')}' with a {final_score}% match score was found near {found_doc.get('location_found')}.",
                    notification_type="potential_match",
                    related_item_id=lost_id_str
                )

                # Notify found reporter
                found_owner_id = str(found_doc.get("user_id"))
                await notification_service.create_notification(
                    user_id=found_owner_id,
                    title="Potential Owner Identified!",
                    message=f"A reported lost item '{lost_doc.get('title')}' matches the '{found_doc.get('title')}' you found ({final_score}% match score).",
                    notification_type="potential_match",
                    related_item_id=found_id_str
                )

            matches_found.append(match_doc)

        logger.info(f"Matching finished for {item_type} {item_id}: {len(matches_found)} potential matches recorded.")
        return matches_found

    @staticmethod
    async def recalculate_all_matches() -> Dict[str, Any]:
        """Recalculate matches across all active lost items and available found items."""
        db = get_database()
        lost_items = await db.lost_items.find({"status": {"$in": ["active", "potential_match"]}}).to_list(length=1000)
        
        total_eval = 0
        total_created = 0
        high_conf = 0

        for item in lost_items:
            matches = await MatchingService.match_item(str(item["_id"]), "lost")
            total_eval += len(matches)
            for m in matches:
                total_created += 1
                if m.get("match_status") == "high_potential":
                    high_conf += 1

        return {
            "status": "success",
            "matches_evaluated": total_eval,
            "matches_created": total_created,
            "high_confidence_count": high_conf
        }

    @staticmethod
    async def get_matches_for_item(item_id: str, item_type: str = "lost") -> List[Dict[str, Any]]:
        """Get all matches associated with a given lost or found item."""
        db = get_database()
        query_key = "lost_item_id" if item_type == "lost" else "found_item_id"
        cursor = db.matches.find({query_key: str(item_id)}).sort("final_score", -1)
        raw_matches = await cursor.to_list(length=50)

        results = []
        for m in raw_matches:
            # Populate foreign items
            lost_item = await db.lost_items.find_one({"_id": ObjectId(m["lost_item_id"])})
            found_item = await db.found_items.find_one({"_id": ObjectId(m["found_item_id"])})
            m["lost_item"] = serialize_doc(lost_item)
            m["found_item"] = serialize_doc(found_item)
            results.append(serialize_doc(m))

        return results

    @staticmethod
    async def get_user_matches(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve potential matches for all reports owned by this user."""
        db = get_database()
        # Find user's lost items
        user_lost = await db.lost_items.find({"user_id": user_id}).to_list(length=200)
        lost_ids = [str(x["_id"]) for x in user_lost]
        
        # Find user's found items
        user_found = await db.found_items.find({"user_id": user_id}).to_list(length=200)
        found_ids = [str(x["_id"]) for x in user_found]

        cursor = db.matches.find({
            "$or": [
                {"lost_item_id": {"$in": lost_ids}},
                {"found_item_id": {"$in": found_ids}}
            ]
        }).sort("final_score", -1)
        
        matches = await cursor.to_list(length=50)
        results = []
        for m in matches:
            lost = await db.lost_items.find_one({"_id": ObjectId(m["lost_item_id"])})
            found = await db.found_items.find_one({"_id": ObjectId(m["found_item_id"])})
            m["lost_item"] = serialize_doc(lost)
            m["found_item"] = serialize_doc(found)
            results.append(serialize_doc(m))

        return results

matching_service = MatchingService()
