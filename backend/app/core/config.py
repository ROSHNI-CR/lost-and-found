from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "HITK FindIt — Heritage Institute of Technology Lost & Found"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Database
    MONGODB_URI: str = "mongodb://127.0.0.1:27017"
    MONGODB_URL: Optional[str] = None
    DATABASE_NAME: str = "findit_ai"

    # AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Security & Auth
    JWT_SECRET_KEY: str = "findit-super-secret-security-jwt-key-change-in-production-2026"
    SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Campus Domain Rules (Heritage Institute of Technology)
    COLLEGE_EMAIL_DOMAINS: str = "heritageit.edu.in,student.heritageit.edu.in,*"

    # CORS & URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://127.0.0.1:8000"

    # Image Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Matching Weights
    WEIGHT_SEMANTIC: float = 0.30
    WEIGHT_CATEGORY: float = 0.20
    WEIGHT_COLOR: float = 0.15
    WEIGHT_BRAND: float = 0.10
    WEIGHT_LOCATION: float = 0.15
    WEIGHT_TEMPORAL: float = 0.10
    MATCH_THRESHOLD_HIGH: float = 80.0
    MATCH_THRESHOLD_POSSIBLE: float = 60.0

    class Config:
        env_file = [".env", "backend/.env"]
        extra = "allow"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
