from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class MatchScoreBreakdown(BaseModel):
    semantic_score: float = Field(..., ge=0.0, le=1.0)
    category_score: float = Field(..., ge=0.0, le=1.0)
    color_score: float = Field(..., ge=0.0, le=1.0)
    brand_score: float = Field(..., ge=0.0, le=1.0)
    location_score: float = Field(..., ge=0.0, le=1.0)
    temporal_score: float = Field(..., ge=0.0, le=1.0)
    final_score: float = Field(..., ge=0.0, le=100.0)

class MatchResponse(BaseModel):
    id: str
    lost_item_id: str
    found_item_id: str
    semantic_score: float
    category_score: float
    color_score: float
    brand_score: float
    location_score: float
    temporal_score: float
    image_score: Optional[float] = None
    final_score: float
    match_explanation: Optional[str] = None
    match_status: str  # high_potential, possible_match, low_confidence, verified, dismissed
    created_at: Optional[datetime] = None
    lost_item: Optional[Dict[str, Any]] = None
    found_item: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class MatchRecalculateResponse(BaseModel):
    status: str
    matches_evaluated: int
    matches_created: int
    high_confidence_count: int
