import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.database.connection import get_database
from app.core.dependencies import require_admin, require_superadmin
from app.core.security import get_password_hash
from app.schemas.admin import (
    AdminDashboardStats,
    AdminUserUpdate,
    AuditLogResponse,
    SystemSettings,
    CreateAdminRequest
)
from app.schemas.claim import ClaimResponse, ClaimReview
from app.schemas.auth import UserProfileResponse
from app.services.analytics_service import analytics_service
from app.services.claim_service import claim_service
from app.utils.response_helpers import serialize_doc, serialize_docs

logger = logging.getLogger("findit.admin_router")
router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(admin_user: dict = Depends(require_admin)):
    """Fetch complete campus analytics, recovery rates, and trends."""
    stats = await analytics_service.get_dashboard_analytics()
    return AdminDashboardStats(**stats)

@router.get("/claims", response_model=List[ClaimResponse])
async def list_admin_claims(
    status_filter: Optional[str] = Query(None, alias="status"),
    admin_user: dict = Depends(require_admin)
):
    """Admin claim verification queue."""
    claims = await claim_service.get_all_claims(status_filter)
    return [ClaimResponse(**c) for c in claims]

@router.put("/claims/{claim_id}/review", response_model=ClaimResponse)
async def review_claim_endpoint(
    claim_id: str,
    req: ClaimReview,
    admin_user: dict = Depends(require_admin)
):
    """Authorize or reject student ownership claim with audit trail."""
    admin_id = str(admin_user["_id"])
    reviewed = await claim_service.review_claim(
        claim_id=claim_id,
        admin_user_id=admin_id,
        new_status=req.status,
        admin_feedback=req.admin_feedback
    )
    return ClaimResponse(**reviewed)

@router.get("/users", response_model=List[UserProfileResponse])
async def list_users(admin_user: dict = Depends(require_admin)):
    """List registered campus users."""
    db = get_database()
    users = await db.users.find({}).sort("created_at", -1).to_list(length=200)
    return [UserProfileResponse(**serialize_doc(u)) for u in users]

@router.put("/users/{user_id}", response_model=UserProfileResponse)
async def update_user(
    user_id: str,
    req: AdminUserUpdate,
    admin_user: dict = Depends(require_admin)
):
    """Update user role or active status. Promoting to superadmin requires superadmin."""
    db = get_database()
    curr_role = admin_user.get("role")
    if req.role == "superadmin" and curr_role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Administrators can promote users to Super Admin"
        )

    update_fields = {k: v for k, v in req.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)

    try:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return UserProfileResponse(**serialize_doc(user))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(admin_user: dict = Depends(require_admin)):
    """Retrieve administrative action audit logs."""
    db = get_database()
    logs = await db.audit_logs.find({}).sort("created_at", -1).limit(100).to_list(length=100)
    return [AuditLogResponse(**serialize_doc(l)) for l in logs]

@router.delete("/reports/{item_type}/{item_id}")
async def moderate_remove_report(
    item_type: str,
    item_id: str,
    admin_user: dict = Depends(require_admin)
):
    """Remove fraudulent or inappropriate report."""
    db = get_database()
    collection = db.lost_items if item_type == "lost" else db.found_items
    try:
        await collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc)}}
        )
        return {"status": "success", "message": f"{item_type.capitalize()} report rejected/removed by admin"}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

@router.get("/settings", response_model=SystemSettings)
async def get_system_settings(admin_user: dict = Depends(require_admin)):
    """Retrieve system configuration settings."""
    db = get_database()
    doc = await db.system_settings.find_one({"key": "global_config"})
    if not doc:
        return SystemSettings()
    return SystemSettings(
        item_categories=doc.get("item_categories", SystemSettings().item_categories),
        campus_locations=doc.get("campus_locations", SystemSettings().campus_locations),
        college_email_domains=doc.get("college_email_domains", "*"),
        ai_model=doc.get("ai_model", "gemini-1.5-flash")
    )

@router.post("/settings", response_model=SystemSettings)
async def save_system_settings(
    settings_data: SystemSettings,
    admin_user: dict = Depends(require_superadmin)
):
    """Save system configuration settings (Super Admin only)."""
    db = get_database()
    now = datetime.now(timezone.utc)
    await db.system_settings.update_one(
        {"key": "global_config"},
        {
            "$set": {
                "item_categories": settings_data.item_categories,
                "campus_locations": settings_data.campus_locations,
                "college_email_domains": settings_data.college_email_domains,
                "ai_model": settings_data.ai_model,
                "updated_at": now,
                "updated_by": str(admin_user["_id"])
            }
        },
        upsert=True
    )
    # Log administrative audit
    await db.audit_logs.insert_one({
        "actor_user_id": str(admin_user["_id"]),
        "action": "UPDATE_SYSTEM_SETTINGS",
        "entity_type": "system_settings",
        "entity_id": "global_config",
        "details": settings_data.model_dump(),
        "created_at": now
    })
    return settings_data

@router.post("/create-admin", response_model=UserProfileResponse)
async def create_admin_user(
    req: CreateAdminRequest,
    admin_user: dict = Depends(require_superadmin)
):
    """Create a new Administrator account (Super Admin only)."""
    db = get_database()
    email_clean = req.email.lower().strip()

    existing = await db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    now = datetime.now(timezone.utc)
    new_admin = {
        "name": req.name.strip(),
        "email": email_clean,
        "password_hash": get_password_hash(req.password),
        "role": "admin",
        "department": req.department or "Campus Administration",
        "student_id": None,
        "profile_image": None,
        "is_verified": True,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    res = await db.users.insert_one(new_admin)
    new_admin["_id"] = res.inserted_id

    # Log audit trail
    await db.audit_logs.insert_one({
        "actor_user_id": str(admin_user["_id"]),
        "action": "CREATE_ADMIN",
        "entity_type": "user",
        "entity_id": str(res.inserted_id),
        "details": {"email": email_clean, "name": req.name},
        "created_at": now
    })

    return UserProfileResponse(**serialize_doc(new_admin))

@router.put("/users/{user_id}/toggle-active", response_model=UserProfileResponse)
async def toggle_user_active(
    user_id: str,
    admin_user: dict = Depends(require_admin)
):
    """Toggle user active status."""
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Prevent deactivating self or superadmin unless actor is superadmin
        if str(user["_id"]) == str(admin_user["_id"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot toggle your own active status")
        if user.get("role") == "superadmin" and admin_user.get("role") != "superadmin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot alter Super Admin status")

        new_status = not user.get("is_active", True)
        now = datetime.now(timezone.utc)
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": new_status, "updated_at": now}}
        )
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        return UserProfileResponse(**serialize_doc(updated_user))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")
