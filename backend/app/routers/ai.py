import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from app.services.gemini_service import gemini_service
from app.services.image_service import image_service
from app.services.chatbot_service import chatbot_service
from app.schemas.item import AIExtractedAttributes
from app.schemas.chatbot import ChatRequest, ChatResponse, QueryInterpretation
from app.core.dependencies import get_current_user_optional

logger = logging.getLogger("findit.ai_router")
router = APIRouter(prefix="/ai", tags=["AI Services"])

@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None)
):
    """
    Multimodal Image Understanding:
    1. Validates and saves uploaded image file.
    2. Sends photograph to Gemini Vision model.
    3. Extracts structured JSON attributes validated by Pydantic.
    4. Returns extracted attributes and stored image URL for user preview/confirmation.
    """
    try:
        # Save image locally / to Cloudinary
        image_url = await image_service.save_image(file)
        
        # Read content for vision analysis
        await file.seek(0)
        content = await file.read()
        mime_type = file.content_type or "image/jpeg"

        # Multimodal Gemini analysis
        extracted = await gemini_service.analyze_image_and_extract(
            image_bytes=content,
            mime_type=mime_type,
            user_notes=notes
        )

        return {
            "image_url": image_url,
            "extracted_attributes": extracted.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis route error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis error: {str(e)}"
        )

@router.post("/generate-description")
async def generate_description(
    title: str = Form(...),
    category: str = Form(...),
    color: str = Form(...),
    features: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    """Generates a clean, descriptive lost/found item description."""
    desc = await gemini_service.generate_item_description(
        title=title,
        category=category,
        color=color,
        features=features,
        notes=notes
    )
    return {"description": desc}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Conversational AI Assistant (FindIt Assistant) with grounded campus context."""
    user_id = str(current_user["_id"]) if current_user else None
    history_dicts = [m.model_dump() for m in req.history] if req.history else []
    
    res = await chatbot_service.chat(
        message=req.message,
        user_id=user_id,
        history=history_dicts
    )
    return ChatResponse(**res)

@router.post("/interpret-query", response_model=QueryInterpretation)
async def interpret_query(query: str = Form(...)):
    """Convert natural-language search query into structured search filters."""
    res = await gemini_service.interpret_search_query(query)
    return res
