from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    password_hash: str
    role: str = "student"  # student, admin, superadmin
    department: Optional[str] = None
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
