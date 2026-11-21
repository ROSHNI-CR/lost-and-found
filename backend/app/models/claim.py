from datetime import datetime, timezone
from typing import Optional, Dict
from pydantic import BaseModel, Field

class ClaimModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    lost_item_id: str
    found_item_id: str
    claimant_user_id: str
    proof_description: str
    proof_answers: Optional[Dict[str, str]] = Field(default_factory=dict)
    status: str = "pending"  # pending, approved, rejected
    admin_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
