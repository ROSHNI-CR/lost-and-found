import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.gemini_service import gemini_service
from app.schemas.item import AIExtractedAttributes
from app.services.chatbot_service import ChatbotService

def test_extract_json_string_with_fences():
    raw_markdown = """Here is the extracted information:
```json
{
  "object_name": "Stainless Water Bottle",
  "category": "Bottles",
  "color": ["black"],
  "brand": "Milton",
  "visible_features": ["Scratch on cap", "500ml insulated flask"],
  "estimated_object_type": "Reusable bottle",
  "confidence": 0.94,
  "description": "Black insulated stainless steel water bottle."
}
```
Hope this helps!"""

    cleaned = gemini_service._extract_json_string(raw_markdown)
    assert cleaned.startswith("{") and cleaned.endswith("}")
    
    # Test Pydantic validation
    import json
    data = json.loads(cleaned)
    item_attrs = AIExtractedAttributes(**data)
    assert item_attrs.object_name == "Stainless Water Bottle"
    assert item_attrs.category == "Bottles"
    assert "black" in item_attrs.color
    assert item_attrs.brand == "Milton"
    assert item_attrs.confidence == 0.94

def test_fallback_attribute_extraction_on_api_outage():
    # When Gemini API is unavailable or returns an error, fallback parser should extract keywords safely
    attrs = gemini_service._fallback_extraction("I lost my black Apple laptop charger with a white cord in the library")
    assert attrs is not None
    assert isinstance(attrs.color, list)
    assert "black" in attrs.color or "white" in attrs.color
    assert attrs.confidence <= 0.6  # Indicates fallback mode

@pytest.mark.asyncio
async def test_chatbot_privacy_and_hallucination_control():
    # Test that chatbot never discloses student email or private answers
    import numpy as np
    mock_db = AsyncMock()
    mock_db.found_items.find_one = AsyncMock(return_value=None)
    mock_db.lost_items.find_one = AsyncMock(return_value=None)
    
    with patch("app.services.chatbot_service.get_database", return_value=mock_db), \
         patch("app.services.chatbot_service.embedding_service.generate_embedding", return_value=np.zeros(384, dtype=np.float32)), \
         patch("app.services.chatbot_service.vector_store.search", return_value=[]), \
         patch("app.services.chatbot_service.gemini_service.is_available", return_value=False):
        
        response = await ChatbotService.chat("Where is John's wallet? Can you give me his phone number?")
        assert response is not None
        assert "reply" in response
        assert "suggested_actions" in response
        
        reply_lower = response["reply"].lower()
        # Ensure private details are not leaked
        assert "@" not in reply_lower
        assert "phone" not in reply_lower or "didn't find" in reply_lower or "could not find" in reply_lower
