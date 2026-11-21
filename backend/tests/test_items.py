import pytest
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from app.schemas.item import LostItemCreate, FoundItemCreate

def test_lost_item_schema_validation():
    valid_payload = {
        "title": "Blue Dell Laptop Backpack",
        "description": "Left in computer lab 3 near row B",
        "category": "Bags",
        "color": "blue",
        "brand": "Dell",
        "location_lost": "Computer Lab 3",
        "approximate_date_lost": "2026-11-20"
    }
    item = LostItemCreate(**valid_payload)
    assert item.title == "Blue Dell Laptop Backpack"
    assert item.category == "Bags"

def test_found_item_schema_validation():
    valid_payload = {
        "title": "Scientific Calculator",
        "description": "Casio FX-991EX found on study desk",
        "category": "Electronics",
        "color": "black",
        "brand": "Casio",
        "location_found": "Central Library",
        "date_found": "2026-11-20",
        "storage_location": "Front Desk Security"
    }
    item = FoundItemCreate(**valid_payload)
    assert item.title == "Scientific Calculator"
    assert item.storage_location == "Front Desk Security"

def test_unauthorized_user_cannot_delete_report(client, test_student_user):
    other_user_id = "664fa1e2b83a000000000099"
    item_id = "664fa1e2b83a000000000088"
    
    mock_db = AsyncMock()
    mock_db.users.find_one = AsyncMock(return_value=test_student_user)
    mock_db.lost_items.find_one = AsyncMock(return_value={
        "_id": ObjectId(item_id),
        "user_id": other_user_id,  # Owned by someone else
        "title": "Secret Item"
    })

    with patch("app.core.dependencies.get_database", return_value=mock_db), \
         patch("app.routers.lost_items.get_database", return_value=mock_db):
        
        token = test_student_user["_id"]
        from app.core.security import create_access_token
        jwt_token = create_access_token({"sub": str(token), "role": "student"})
        
        response = client.delete(f"/api/lost-items/{item_id}", headers={"Authorization": f"Bearer {jwt_token}"})
        assert response.status_code == 403
