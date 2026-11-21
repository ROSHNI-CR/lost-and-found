import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query, BackgroundTasks
from bson import ObjectId
from app.database.connection import get_database
from app.core.dependencies import get_current_user, get_current_user_optional
from app.schemas.item import LostItemCreate, LostItemUpdate, LostItemResponse
from app.services.matching_service import matching_service
from app.services.vector_store import vector_store
from app.utils.response_helpers import serialize_doc, serialize_docs

logger = logging.getLogger("findit.lost_items")
router = APIRouter(prefix="/lost-items", tags=["Lost Items"])

@router.post("", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_item(
    req: LostItemCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    now = datetime.now(timezone.utc)
    user_id = str(current_user["_id"])

    item_doc = req.model_dump()
    item_doc["user_id"] = user_id
    item_doc["status"] = "active"
    item_doc["created_at"] = now
    item_doc["updated_at"] = now

    res = await db.lost_items.insert_one(item_doc)
    item_id_str = str(res.inserted_id)
    item_doc["_id"] = res.inserted_id

    # Trigger intelligent matching pipeline in background
    background_tasks.add_task(matching_service.match_item, item_id_str, "lost")

    # Audit log
    await db.audit_logs.insert_one({
        "actor_user_id": user_id,
        "action": "CREATE_LOST_REPORT",
        "entity_type": "lost_item",
        "entity_id": item_id_str,
        "details": {"title": req.title, "category": req.category},
        "created_at": now
    })

    return LostItemResponse(**serialize_doc(item_doc))

@router.get("", response_model=List[LostItemResponse])
async def list_lost_items(
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
        # By default exclude closed/rejected
        query["status"] = {"$in": ["active", "potential_match", "claim_pending"]}
    if location:
        query["location_lost"] = {"$regex": location, "$options": "i"}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"location_lost": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.lost_items.find(query).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    return [LostItemResponse(**serialize_doc(i)) for i in items]

@router.get("/my-reports", response_model=List[LostItemResponse])
async def get_my_lost_reports(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])
    items = await db.lost_items.find({"user_id": user_id}).sort("created_at", -1).to_list(length=100)
    return [LostItemResponse(**serialize_doc(i)) for i in items]

@router.get("/{item_id}", response_model=LostItemResponse)
async def get_lost_item(item_id: str):
    db = get_database()
    try:
        item = await db.lost_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost item report not found")
    return LostItemResponse(**serialize_doc(item))

@router.put("/{item_id}", response_model=LostItemResponse)
async def update_lost_item(
    item_id: str,
    req: LostItemUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    try:
        existing = await db.lost_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    user_id = str(current_user["_id"])
    user_role = current_user.get("role", "student")

    # Check ownership
    if existing.get("user_id") != user_id and user_role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only modify your own reports")

    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.lost_items.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    
    # Re-run matching in background
    background_tasks.add_task(matching_service.match_item, item_id, "lost")

    updated = await db.lost_items.find_one({"_id": ObjectId(item_id)})
    return LostItemResponse(**serialize_doc(updated))

@router.delete("/{item_id}")
async def delete_lost_item(item_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        existing = await db.lost_items.find_one({"_id": ObjectId(item_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    user_id = str(current_user["_id"])
    user_role = current_user.get("role", "student")

    if existing.get("user_id") != user_id and user_role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only withdraw your own reports")

    # Mark as closed
    await db.lost_items.update_one({"_id": ObjectId(item_id)}, {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc)}})
    vector_store.remove_item(item_id, "lost")

    return {"status": "success", "message": "Report withdrawn successfully"}
