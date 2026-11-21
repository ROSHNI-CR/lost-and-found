from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: Optional[List[ChatMessage]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = Field(default_factory=list)
    relevant_items: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class QueryInterpretation(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    location: Optional[str] = None
    date_range: Optional[str] = None
    keywords: Optional[List[str]] = Field(default_factory=list)
    item_type: Optional[str] = None  # "lost" or "found"
