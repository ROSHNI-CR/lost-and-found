import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.database.connection import get_database
from app.services.notification_service import notification_service
from app.utils.response_helpers import serialize_doc, serialize_docs

logger = logging.getLogger("findit.claims")

class ClaimService:
    @staticmethod
    async def submit_claim(
        claimant_user_id: str,
        lost_item_id: str,
        found_item_id: str,
        proof_description: str,
        proof_answers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Submit ownership claim for a found item."""
        db = get_database()

        # Verify found item exists
        found_item = await db.found_items.find_one({"_id": ObjectId(found_item_id)})
        if not found_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item not found")

        # Verify lost item exists and belongs to claimant
        lost_item = await db.lost_items.find_one({"_id": ObjectId(lost_item_id)})
        if not lost_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost item report not found")
        if str(lost_item.get("user_id")) != claimant_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only submit claims referencing your own lost item report"
            )

        # Check for existing claim
        existing = await db.claims.find_one({
            "claimant_user_id": claimant_user_id,
            "found_item_id": found_item_id,
            "status": "pending"
        })
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have a pending claim for this item")

        claim_doc = {
            "lost_item_id": lost_item_id,
            "found_item_id": found_item_id,
            "claimant_user_id": claimant_user_id,
            "proof_description": proof_description,
            "proof_answers": proof_answers or {},
            "status": "pending",
            "admin_feedback": None,
            "created_at": datetime.now(timezone.utc),
            "reviewed_at": None
        }

        res = await db.claims.insert_one(claim_doc)
        claim_doc["_id"] = res.inserted_id

        # Update item statuses to claim_pending
        await db.lost_items.update_one({"_id": ObjectId(lost_item_id)}, {"$set": {"status": "claim_pending"}})
        await db.found_items.update_one({"_id": ObjectId(found_item_id)}, {"$set": {"status": "claim_pending"}})

        # Audit log entry
        await db.audit_logs.insert_one({
            "actor_user_id": claimant_user_id,
            "action": "SUBMIT_CLAIM",
            "entity_type": "claim",
            "entity_id": str(res.inserted_id),
            "details": {"lost_item_id": lost_item_id, "found_item_id": found_item_id},
            "created_at": datetime.now(timezone.utc)
        })

        # Notify claimant
        await notification_service.create_notification(
            user_id=claimant_user_id,
            title="Claim Submitted",
            message=f"Your claim for '{found_item.get('title')}' has been submitted for administrative review.",
            notification_type="new_claim",
            related_item_id=found_item_id
        )

        return serialize_doc(claim_doc)

    @staticmethod
    async def review_claim(
        claim_id: str,
        admin_user_id: str,
        new_status: str,  # approved or rejected
        admin_feedback: Optional[str] = None
    ) -> Dict[str, Any]:
        """Review ownership claim by authorized administrator."""
        db = get_database()
        claim = await db.claims.find_one({"_id": ObjectId(claim_id)})
        if not claim:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")

        now = datetime.now(timezone.utc)
        await db.claims.update_one(
            {"_id": ObjectId(claim_id)},
            {"$set": {
                "status": new_status,
                "admin_feedback": admin_feedback,
                "reviewed_at": now
            }}
        )

        lost_id = claim.get("lost_item_id")
        found_id = claim.get("found_item_id")
        claimant_id = claim.get("claimant_user_id")

        if new_status == "approved":
            # Item is verified and ready for handover / recovered
            await db.lost_items.update_one({"_id": ObjectId(lost_id)}, {"$set": {"status": "recovered"}})
            await db.found_items.update_one({"_id": ObjectId(found_id)}, {"$set": {"status": "claimed"}})
            
            # Notify claimant
            await notification_service.create_notification(
                user_id=claimant_id,
                title="Claim Approved! 🎉",
                message=f"Your ownership claim has been verified and approved! {admin_feedback or 'Please visit campus security to collect your item.'}",
                notification_type="claim_approved",
                related_item_id=found_id
            )
        else:
            # If rejected, revert statuses back to active / available
            await db.lost_items.update_one({"_id": ObjectId(lost_id)}, {"$set": {"status": "active"}})
            await db.found_items.update_one({"_id": ObjectId(found_id)}, {"$set": {"status": "available"}})

            # Notify claimant
            await notification_service.create_notification(
                user_id=claimant_id,
                title="Claim Update",
                message=f"Your claim could not be verified at this time. Feedback: {admin_feedback or 'Insufficient proof provided.'}",
                notification_type="claim_rejected",
                related_item_id=found_id
            )

        # Audit log entry
        await db.audit_logs.insert_one({
            "actor_user_id": admin_user_id,
            "action": f"CLAIM_{new_status.upper()}",
            "entity_type": "claim",
            "entity_id": claim_id,
            "details": {"feedback": admin_feedback, "lost_item_id": lost_id, "found_item_id": found_id},
            "created_at": now
        })

        updated = await db.claims.find_one({"_id": ObjectId(claim_id)})
        return serialize_doc(updated)

    @staticmethod
    async def get_user_claims(user_id: str) -> List[Dict[str, Any]]:
        """Retrieve claims submitted by a user."""
        db = get_database()
        claims = await db.claims.find({"claimant_user_id": user_id}).sort("created_at", -1).to_list(length=50)
        
        results = []
        for c in claims:
            lost = await db.lost_items.find_one({"_id": ObjectId(c["lost_item_id"])})
            found = await db.found_items.find_one({"_id": ObjectId(c["found_item_id"])})
            c["lost_item"] = serialize_doc(lost)
            c["found_item"] = serialize_doc(found)
            results.append(serialize_doc(c))
        return results

    @staticmethod
    async def get_all_claims(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Admin: Retrieve all claims with populated claimant and item data."""
        db = get_database()
        query = {"status": status_filter} if status_filter else {}
        claims = await db.claims.find(query).sort("created_at", -1).to_list(length=100)

        results = []
        for c in claims:
            lost = await db.lost_items.find_one({"_id": ObjectId(c["lost_item_id"])})
            found = await db.found_items.find_one({"_id": ObjectId(c["found_item_id"])})
            user = await db.users.find_one({"_id": ObjectId(c["claimant_user_id"])})
            
            c["lost_item"] = serialize_doc(lost)
            c["found_item"] = serialize_doc(found)
            if user:
                user["password_hash"] = None
            c["claimant"] = serialize_doc(user)
            results.append(serialize_doc(c))
        return results

claim_service = ClaimService()
