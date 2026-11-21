from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class AIExtractedAttributes(BaseModel):
    object_name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[List[str]] = Field(default_factory=list)
    brand: Optional[str] = None
    visible_features: Optional[List[str]] = Field(default_factory=list)
    estimated_object_type: Optional[str] = None
    confidence: Optional[float] = 0.0
    description: Optional[str] = None

class LostItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    category: str = Field(..., min_length=2, max_length=50)
    brand: Optional[str] = None
    color: Union[str, List[str]]
    identifying_features: Optional[str] = None
    approximate_date_lost: str
    time_range: Optional[str] = None
    location_lost: str = Field(..., min_length=2, max_length=150)
    image_urls: Optional[List[str]] = Field(default_factory=list)
    ai_generated_description: Optional[str] = None
    ai_extracted_attributes: Optional[Dict[str, Any]] = None

class LostItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[Union[str, List[str]]] = None
    identifying_features: Optional[str] = None
    approximate_date_lost: Optional[str] = None
    time_range: Optional[str] = None
    location_lost: Optional[str] = None
    image_urls: Optional[List[str]] = None
    status: Optional[str] = None

class LostItemResponse(BaseModel):
    id: str
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
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FoundItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    category: str = Field(..., min_length=2, max_length=50)
    brand: Optional[str] = None
    color: Union[str, List[str]]
    identifying_features: Optional[str] = None
    date_found: str
    time_found: Optional[str] = None
    location_found: str = Field(..., min_length=2, max_length=150)
    storage_location: Optional[str] = "Campus Security Office"
    image_urls: Optional[List[str]] = Field(default_factory=list)
    ai_generated_description: Optional[str] = None
    ai_extracted_attributes: Optional[Dict[str, Any]] = None

class FoundItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[Union[str, List[str]]] = None
    identifying_features: Optional[str] = None
    date_found: Optional[str] = None
    time_found: Optional[str] = None
    location_found: Optional[str] = None
    storage_location: Optional[str] = None
    image_urls: Optional[List[str]] = None
    status: Optional[str] = None

class FoundItemResponse(BaseModel):
    id: str
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
    storage_location: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)
    ai_generated_description: Optional[str] = None
    ai_extracted_attributes: Optional[Dict[str, Any]] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
