import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.services.notification_service import notification_service
from app.schemas.notification import NotificationResponse

logger = logging.getLogger("findit.notifications_router")
router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    notifs = await notification_service.get_user_notifications(user_id)
    return [NotificationResponse(**n) for n in notifs]

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    count = await notification_service.get_unread_count(user_id)
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    success = await notification_service.mark_as_read(notification_id, user_id)
    return {"status": "success", "updated": success}

@router.put("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    count = await notification_service.mark_all_as_read(user_id)
    return {"status": "success", "marked_read_count": count}
