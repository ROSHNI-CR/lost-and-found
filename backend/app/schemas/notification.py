from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str  # potential_match, new_claim, claim_approved, claim_rejected, item_recovered, admin_message
    related_item_id: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
