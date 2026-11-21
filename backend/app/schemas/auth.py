from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[str] = "student"
    department: Optional[str] = None
    student_id: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfileResponse"

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = None
    student_id: Optional[str] = None
    profile_image: Optional[str] = None
    is_verified: bool = True
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
