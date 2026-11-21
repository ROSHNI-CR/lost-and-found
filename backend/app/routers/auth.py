import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from functools import wraps
from fastapi import APIRouter, HTTPException, status, Depends, Request
from bson import ObjectId
from app.database.connection import get_database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserProfileResponse
from app.utils.response_helpers import serialize_doc

logger = logging.getLogger("findit.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

# --------------- Simple in-memory rate limiter ---------------
_rate_limit_store: dict[str, list[float]] = defaultdict(list)

def rate_limit(max_requests: int, window_seconds: int = 60):
    """Decorator that limits calls per client IP within a sliding window."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, request: Request, **kwargs):
            client_ip = request.client.host if request.client else "unknown"
            key = f"{func.__name__}:{client_ip}"
            now = time.time()
            # Prune timestamps outside the window
            _rate_limit_store[key] = [
                ts for ts in _rate_limit_store[key] if now - ts < window_seconds
            ]
            if len(_rate_limit_store[key]) >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {window_seconds} seconds.",
                )
            _rate_limit_store[key].append(now)
            return await func(*args, request=request, **kwargs)
        return wrapper
    return decorator

def is_email_domain_allowed(email: str) -> bool:
    """Validate college email domain against configurable allowed domains."""
    allowed = settings.COLLEGE_EMAIL_DOMAINS.strip()
    if allowed == "*" or not allowed:
        return True
    domain = email.split("@")[-1].lower()
    allowed_list = [d.strip().lower() for d in allowed.split(",")]
    return domain in allowed_list

@router.post("/register", response_model=TokenResponse)
@rate_limit(max_requests=5, window_seconds=60)
async def register(req: UserRegisterRequest, request: Request):
    db = get_database()
    email_clean = req.email.lower().strip()

    # Validate email domain
    if not is_email_domain_allowed(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email domain not allowed. College domain required ({settings.COLLEGE_EMAIL_DOMAINS})."
        )

    # Check if user already exists
    existing = await db.users.find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Check if this is the first user; if so, make them Super Admin
    user_count = await db.users.count_documents({})
    assigned_role = "superadmin" if user_count == 0 else (req.role or "student")
    if assigned_role not in ["student", "admin", "superadmin"]:
        assigned_role = "student"

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": req.name.strip(),
        "email": email_clean,
        "password_hash": get_password_hash(req.password),
        "role": assigned_role,
        "department": req.department,
        "student_id": req.student_id,
        "profile_image": None,
        "is_verified": True,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    res = await db.users.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    # Create access token
    token = create_access_token({"sub": str(res.inserted_id), "role": assigned_role, "email": email_clean})
    user_profile = serialize_doc(user_doc)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(**user_profile)
    )

@router.post("/login", response_model=TokenResponse)
@rate_limit(max_requests=10, window_seconds=60)
async def login(req: UserLoginRequest, request: Request):
    db = get_database()
    email_clean = req.email.lower().strip()

    user = await db.users.find_one({"email": email_clean})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended. Please contact administrator."
        )

    token = create_access_token({
        "sub": str(user["_id"]),
        "role": user.get("role", "student"),
        "email": email_clean
    })
    user_profile = serialize_doc(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse(**user_profile)
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserProfileResponse(**serialize_doc(current_user))
