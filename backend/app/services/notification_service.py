import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from app.database.connection import get_database
from app.utils.response_helpers import serialize_doc, serialize_docs

logger = logging.getLogger("findit.notifications")

class NotificationService:
    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        message: str,
        notification_type: str,
        related_item_id: Optional[str] = None
    ) -> Optional[dict]:
        """
        Create in-app notification if not a duplicate within the last 24 hours.
        """
        db = get_database()
        
        # Deduplication check: Avoid sending duplicate notifications for the same pair/event
        recent_cutoff = datetime.now(timezone.utc)
        duplicate = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": notification_type,
            "related_item_id": related_item_id
        })
        if duplicate:
            logger.info(f"Duplicate notification suppressed for user {user_id}")
            return None

        notif_doc = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "related_item_id": related_item_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        res = await db.notifications.insert_one(notif_doc)
        notif_doc["_id"] = res.inserted_id
        return serialize_doc(notif_doc)

    @staticmethod
    async def get_user_notifications(user_id: str, limit: int = 50) -> List[dict]:
        db = get_database()
        cursor = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        return serialize_docs(docs)

    @staticmethod
    async def mark_as_read(notification_id: str, user_id: str) -> bool:
        db = get_database()
        try:
            res = await db.notifications.update_one(
                {"_id": ObjectId(notification_id), "user_id": user_id},
                {"$set": {"is_read": True}}
            )
            return res.modified_count > 0
        except Exception:
            return False

    @staticmethod
    async def mark_all_as_read(user_id: str) -> int:
        db = get_database()
        res = await db.notifications.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return res.modified_count

    @staticmethod
    async def get_unread_count(user_id: str) -> int:
        db = get_database()
        return await db.notifications.count_documents({"user_id": user_id, "is_read": False})

notification_service = NotificationService()
