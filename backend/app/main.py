import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection, get_database
from app.database.indexes import create_indexes
from app.services.vector_store import vector_store
from app.services.embedding_service import embedding_service
from app.services.gemini_service import gemini_service

from app.routers import (
    auth,
    lost_items,
    found_items,
    matching,
    search,
    ai,
    claims,
    notifications,
    admin
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("findit.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Lifecycle ---
    logger.info("Initializing FindIt AI Backend Services...")
    
    # 1. Ensure local uploads directory exists
    upload_path = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
    os.makedirs(upload_path, exist_ok=True)
    
    # 2. Connect to MongoDB and initialize indexes
    try:
        await connect_to_mongo()
        await create_indexes()
        db = get_database()
        await vector_store.rebuild_from_database(db, embedding_service)
    except Exception as e:
        logger.warning(f"Database connection could not be established at startup: {e}. Operating in fallback/testing mode.")

    logger.info("FindIt AI application startup complete.")
    yield
    # --- Shutdown Lifecycle ---
    logger.info("Shutting down FindIt AI application...")
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent College Campus Lost & Found Management System with Multimodal GenAI and Vector Similarity Search",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads static directory for image serving
upload_path = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
os.makedirs(upload_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(lost_items.router, prefix=settings.API_V1_PREFIX)
app.include_router(found_items.router, prefix=settings.API_V1_PREFIX)
app.include_router(matching.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(claims.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    db_status = "connected"
    try:
        db = get_database()
        await db.command("ping")
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "ai_service": "configured" if gemini_service.is_available() else "fallback_mode",
        "vector_store": {
            "lost_count": len(vector_store.id_list.get("lost", [])),
            "found_count": len(vector_store.id_list.get("found", []))
        }
    }
