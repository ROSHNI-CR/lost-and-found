import os
import sys
from datetime import datetime, timezone
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
import numpy as np
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.services.embedding_service import EmbeddingService
from app.services.gemini_service import GeminiService
from app.database.connection import db_instance
import app.database.connection as conn_module
from app.main import app

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Ensure automated tests never make outbound calls and use an in-memory mock DB."""
    # Mock AI services
    monkeypatch.setattr(
        EmbeddingService,
        "generate_embedding",
        lambda self, text: np.zeros(384, dtype=np.float32)
    )
    monkeypatch.setattr(
        GeminiService,
        "is_available",
        lambda self: False
    )

    # In-memory mock MongoDB
    db = MagicMock()
    db.users = AsyncMock()
    db.lost_items = AsyncMock()
    db.found_items = AsyncMock()
    db.matches = AsyncMock()
    db.claims = AsyncMock()
    db.notifications = AsyncMock()
    db.audit_logs = AsyncMock()
    db.command = AsyncMock(return_value={"ok": 1})

    monkeypatch.setattr(db_instance, "db", db)
    monkeypatch.setattr(conn_module, "get_database", lambda: db)
    return db

@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient instance with mocked lifespan database startup."""
    with patch("app.main.connect_to_mongo", new_callable=AsyncMock), \
         patch("app.main.create_indexes", new_callable=AsyncMock), \
         patch("app.main.vector_store.rebuild_from_database", new_callable=AsyncMock), \
         patch("app.main.close_mongo_connection", new_callable=AsyncMock):
        with TestClient(app) as c:
            yield c

@pytest.fixture
def test_student_user():
    return {
        "_id": "664fa1e2b83a000000000001",
        "name": "Jane Student",
        "email": "jane@campus.edu",
        "password_hash": get_password_hash("StudentPass123!"),
        "role": "student",
        "department": "Computer Science",
        "student_id": "CS-2026-042",
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }

@pytest.fixture
def test_admin_user():
    return {
        "_id": "664fa1e2b83a000000000002",
        "name": "Admin Officer",
        "email": "admin@campus.edu",
        "password_hash": get_password_hash("AdminPass123!"),
        "role": "admin",
        "department": "Campus Security & Administration",
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }

@pytest.fixture
def student_auth_headers(test_student_user):
    token = create_access_token({"sub": str(test_student_user["_id"]), "role": test_student_user["role"]})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(test_admin_user):
    token = create_access_token({"sub": str(test_admin_user["_id"]), "role": test_admin_user["role"]})
    return {"Authorization": f"Bearer {token}"}
