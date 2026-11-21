from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ClaimCreate(BaseModel):
    lost_item_id: str
    found_item_id: str
    proof_description: str = Field(..., min_length=10, max_length=2000)
    proof_answers: Optional[Dict[str, str]] = Field(default_factory=dict)

class ClaimReview(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    admin_feedback: Optional[str] = None

class ClaimResponse(BaseModel):
    id: str
    lost_item_id: str
    found_item_id: str
    claimant_user_id: str
    proof_description: str
    proof_answers: Optional[Dict[str, str]] = None
    status: str  # pending, approved, rejected
    admin_feedback: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    lost_item: Optional[Dict[str, Any]] = None
    found_item: Optional[Dict[str, Any]] = None
    claimant: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
