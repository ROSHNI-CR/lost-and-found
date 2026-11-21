from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class LostItemModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    description: str
    category: str
    brand: Optional[str] = None
    color: Union[str, List[str]]
    identifying_features: Optional[str] = None
    approximate_date_lost: str
    time_range: Optional[str] = None
    location_lost: str
    image_urls: List[str] = Field(default_factory=list)
    ai_generated_description: Optional[str] = None
    ai_extracted_attributes: Optional[Dict[str, Any]] = None
    embedding_reference: Optional[str] = None
    status: str = "active"  # active, potential_match, claim_pending, recovered, closed, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
