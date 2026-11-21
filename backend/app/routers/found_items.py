import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query, BackgroundTasks
from bson import ObjectId
from app.database.connection import get_database
from app.core.dependencies import get_current_user
from app.schemas.item import FoundItemCreate, FoundItemUpdate, FoundItemResponse
from app.services.matching_service import matching_service
from app.services.vector_store import vector_store
from app.utils.response_helpers import serialize_doc

logger = logging.getLogger("findit.found_items")
router = APIRouter(prefix="/found-items", tags=["Found Items"])

@router.post("", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
async def create_found_item(
    req: FoundItemCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    now = datetime.now(timezone.utc)
    user_id = str(current_user["_id"])

    item_doc = req.model_dump()
    item_doc["user_id"] = user_id
    item_doc["status"] = "available"
    item_doc["created_at"] = now
    item_doc["updated_at"] = now

    res = await db.found_items.insert_one(item_doc)
    item_id_str = str(res.inserted_id)
    item_doc["_id"] = res.inserted_id

    # Trigger intelligent matching pipeline in background against active lost items
    background_tasks.add_task(matching_service.match_item, item_id_str, "found")

    # Audit log
    await db.audit_logs.insert_one({
        "actor_user_id": user_id,
        "action": "CREATE_FOUND_REPORT",
        "entity_type": "found_item",
        "entity_id": item_id_str,
        "details": {"title": req.title, "category": req.category},
        "created_at": now
    })

    return FoundItemResponse(**serialize_doc(item_doc))

@router.get("", response_model=List[FoundItemResponse])
async def list_found_items(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    location: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    db = get_database()
    query = {}
    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}
    if status_filter and status_filter.lower() != "all":
        query["status"] = status_filter
    else:
        # By default exclude claimed/closed/handed_over
        query["status"] = {"$in": ["available", "potential_match", "claim_pending"]}
    if location:
        query["location_found"] = {"$regex": location, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"location_found": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.found_items.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    return [FoundItemResponse(**serialize_doc(i)) for i in items]

@router.get("/my-reports", response_model=List[FoundItemResponse])
async def get_my_found_reports(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])
    items = await db.found_items.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
    return [FoundItemResponse(**serialize_doc(i)) for i in items]

@router.get("/{item_id}", response_model=FoundItemResponse)
async def get_found_item(item_id: str):
    db = get_database()
    try:
        item = await db.found_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item report not found")
    return FoundItemResponse(**serialize_doc(item))

@router.put("/{item_id}", response_model=FoundItemResponse)
async def update_found_item(
    item_id: str,
    req: FoundItemUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    try:
        existing = await db.found_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    user_id = str(current_user["_id"])
    user_role = current_user.get("role", "student")

    if existing.get("user_id") != user_id and user_role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only modify your own reports")

    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.found_items.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    
    # Re-run matching in background
    background_tasks.add_task(matching_service.match_item, item_id, "found")

    updated = await db.found_items.find_one({"_id": ObjectId(item_id)})
    return FoundItemResponse(**serialize_doc(updated))

@router.delete("/{item_id}")
async def delete_found_item(item_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        existing = await db.found_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    user_id = str(current_user["_id"])
    user_role = current_user.get("role", "student")

    if existing.get("user_id") != user_id and user_role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only withdraw your own reports")

    await db.found_items.update_one({"_id": ObjectId(item_id)}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}})
    vector_store.remove_item(item_id, "found")

    return {"status": "success", "message": "Report withdrawn successfully"}
