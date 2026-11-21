import pytest
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    raw_pass = "CampusSecurePass2026!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "664fa1e2b83a000000000001", "role": "student"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == payload["sub"]
    assert decoded["role"] == payload["role"]
    assert "exp" in decoded

def test_expired_or_invalid_jwt():
    invalid_token = "invalid.token.signature"
    assert decode_access_token(invalid_token) is None

def test_auth_me_endpoint(client, test_student_user):
    with patch("app.core.dependencies.get_database") as mock_get_db:
        mock_db = AsyncMock()
        mock_db.users.find_one = AsyncMock(return_value=test_student_user)
        mock_get_db.return_value = mock_db

        token = create_access_token({"sub": str(test_student_user["_id"]), "role": "student"})
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_student_user["email"]
        assert data["role"] == "student"
        assert "password_hash" not in data
