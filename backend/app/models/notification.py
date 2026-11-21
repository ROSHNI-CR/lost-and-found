from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class NotificationModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    message: str
    notification_type: str  # potential_match, new_claim, claim_approved, claim_rejected, item_recovered, admin_message
    related_item_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
