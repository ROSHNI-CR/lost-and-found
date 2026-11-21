import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, Body
from bson import ObjectId
from app.database.connection import get_database
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.services.gemini_service import gemini_service
from app.utils.response_helpers import serialize_doc, serialize_docs

logger = logging.getLogger("findit.search_router")
router = APIRouter(prefix="/search", tags=["Search"])

@router.get("")
async def search_items(
    q: str = Query(..., min_length=1),
    item_type: str = Query("both", regex="^(lost|found|both)$"),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None)
):
    """
    Intelligent Hybrid Search:
    Interprets natural language queries using Gemini, extracts filters,
    and blends MongoDB regex filtering with FAISS vector similarity.
    """
    db = get_database()
    
    # 1. Interpret query intent
    interpretation = await gemini_service.interpret_search_query(q)
    
    # Determine effective filters (explicit params override LLM extraction)
    eff_cat = category or interpretation.category
    eff_loc = location or interpretation.location
    eff_type = item_type if item_type != "both" else (interpretation.item_type or "both")

    # 2. Vector search
    query_vec = embedding_service.generate_embedding(q)
    results = []

    target_types = ["found", "lost"] if eff_type == "both" else [eff_type]
    
    for t in target_types:
        collection = db.found_items if t == "found" else db.lost_items
        vector_candidates = vector_store.search(query_vec, t, top_k=20)
        
        seen_ids = set()
        # Retrieve vector matches
        for c_id, score in vector_candidates:
            if score < 0.35:
                continue
            doc = await collection.find_one({"_id": ObjectId(c_id)})
            if doc:
                seen_ids.add(c_id)
                doc["search_score"] = round(score * 100, 1)
                doc["item_type"] = t
                results.append(serialize_doc(doc))

        # 3. Supplemental MongoDB filter query for exact keywords/categories
        fallback_query = {}
        if eff_cat and eff_cat.lower() != "all":
            fallback_query["category"] = {"$regex": eff_cat, "$options": "i"}
        if eff_loc:
            loc_key = "location_found" if t == "found" else "location_lost"
            fallback_query[loc_key] = {"$regex": eff_loc, "$options": "i"}
            
        cursor = collection.find(fallback_query).limit(10)
        async for doc in cursor:
            doc_id_str = str(doc["_id"])
            if doc_id_str not in seen_ids:
                doc["search_score"] = 65.0
                doc["item_type"] = t
                results.append(serialize_doc(doc))

    # Sort results by search score descending
    results.sort(key=lambda x: x.get("search_score", 0), reverse=True)

    return {
        "query": q,
        "interpretation": interpretation.model_dump(),
        "total_results": len(results),
        "results": results[:30]
    }

@router.post("/semantic")
async def semantic_search(
    query: str = Body(..., embed=True),
    item_type: str = Body("found", embed=True),
    top_k: int = Body(15, embed=True)
):
    """Direct dense vector similarity search against active items."""
    db = get_database()
    collection = db.found_items if item_type == "found" else db.lost_items
    
    vec = embedding_service.generate_embedding(query)
    candidates = vector_store.search(vec, item_type, top_k=top_k)

    items = []
    for c_id, score in candidates:
        doc = await collection.find_one({"_id": ObjectId(c_id)})
        if doc:
            doc["semantic_similarity"] = round(score, 3)
            doc["item_type"] = item_type
            items.append(serialize_doc(doc))

    return {
        "query": query,
        "total": len(items),
        "items": items
    }
