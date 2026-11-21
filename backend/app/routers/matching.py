import logging
from typing import List
from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user, require_admin
from app.services.matching_service import matching_service
from app.schemas.match import MatchResponse, MatchRecalculateResponse

logger = logging.getLogger("findit.matching_router")
router = APIRouter(prefix="/matches", tags=["Matching"])

@router.get("", response_model=List[MatchResponse])
async def get_my_matches(current_user: dict = Depends(get_current_user)):
    """Retrieve all potential matches for current user's lost or found reports."""
    user_id = str(current_user["_id"])
    matches = await matching_service.get_user_matches(user_id)
    return [MatchResponse(**m) for m in matches]

@router.get("/item/{item_id}", response_model=List[MatchResponse])
async def get_item_matches(
    item_id: str,
    item_type: str = Query("lost", regex="^(lost|found)$"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all matches associated with a specific item."""
    matches = await matching_service.get_matches_for_item(item_id, item_type)
    return [MatchResponse(**m) for m in matches]

@router.post("/recalculate", response_model=MatchRecalculateResponse)
async def recalculate_all_matches(admin_user: dict = Depends(require_admin)):
    """Admin endpoint to recalculate all active matches across the campus."""
    res = await matching_service.recalculate_all_matches()
    return MatchRecalculateResponse(**res)
