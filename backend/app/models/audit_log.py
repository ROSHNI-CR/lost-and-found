from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class AuditLogModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    actor_user_id: str
    action: str  # SUBMIT_CLAIM, CLAIM_APPROVED, CLAIM_REJECTED, DELETE_REPORT, etc.
    entity_type: str  # claim, lost_item, found_item, user
    entity_id: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
