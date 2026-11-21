from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---- Super Admin schemas ----

class SystemSettings(BaseModel):
    item_categories: List[str] = Field(default_factory=list)
    campus_locations: List[str] = Field(default_factory=list)
    college_email_domains: str = ""
    ai_model: str = "gemini-2.0-flash"

class CreateAdminRequest(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None


# ---- Existing schemas ----

class CategoryCount(BaseModel):
    category: str
    count: int

class LocationCount(BaseModel):
    location: str
    count: int

class MonthlyTrend(BaseModel):
    month: str
    lost: int
    found: int
    recovered: int

class AdminDashboardStats(BaseModel):
    total_users: int
    total_lost: int
    total_found: int
    total_recovered: int
    recovery_rate: float  # Percentage
    average_recovery_days: float
    total_potential_matches: int
    high_confidence_matches: int
    pending_claims: int
    popular_categories: List[CategoryCount]
    popular_locations: List[LocationCount]
    monthly_trends: List[MonthlyTrend]

class AdminUserUpdate(BaseModel):
    role: Optional[str] = Field(None, pattern="^(student|admin|superadmin)$")
    is_active: Optional[bool] = None
    department: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: str
    actor_user_id: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SystemSettings(BaseModel):
    item_categories: List[str] = [
        "Electronics", "Books & Stationery", "Clothing & Wearables",
        "ID Cards & Wallets", "Keys", "Bags & Backpacks", "Water Bottles",
        "Accessories & Jewelry", "Documents & Certificates", "Sports Equipment", "Other"
    ]
    campus_locations: List[str] = [
        "Central Block (CB)",
        "ICT Block (CSE / IT)",
        "CME Block (Civil / Mech / Chem)",
        "Central Library (Swami Vivekananda Block)",
        "Main Canteen & Food Court",
        "Nescafe Kiosk",
        "Swami Vivekananda Auditorium",
        "Amphitheatre (OAT)",
        "Heritage Sports Ground",
        "Basketball Court",
        "Campus Security Desk (Gate 1)",
        "Security Office (Gate 2)",
        "Boys' Hostel",
        "Girls' Hostel",
        "Student Activity Centre (SAC)",
        "Administrative Office"
    ]
    college_email_domains: str = "heritageit.edu.in,student.heritageit.edu.in,*"
    ai_model: str = "gemini-1.5-flash"

class CreateAdminRequest(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = "Campus Administration"
