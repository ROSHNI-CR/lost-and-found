from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class MatchModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
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
    match_status: str  # high_potential, possible_match, low_confidence
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
