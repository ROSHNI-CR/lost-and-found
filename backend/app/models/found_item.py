from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class FoundItemModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    description: str
    category: str
    brand: Optional[str] = None
    color: Union[str, List[str]]
    identifying_features: Optional[str] = None
    date_found: str
    time_found: Optional[str] = None
    location_found: str
    image_urls: List[str] = Field(default_factory=list)
    ai_generated_description: Optional[str] = None
    ai_extracted_attributes: Optional[Dict[str, Any]] = None
    embedding_reference: Optional[str] = None
    storage_location: Optional[str] = None  # e.g. "Campus Security Office Room 102"
    status: str = "available"  # available, potential_match, claim_pending, claimed, handed_over, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
