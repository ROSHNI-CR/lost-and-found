import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.schemas.claim import ClaimCreate, ClaimResponse
from app.services.claim_service import claim_service

logger = logging.getLogger("findit.claims_router")
router = APIRouter(prefix="/claims", tags=["Ownership Claims"])

@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def submit_claim(
    req: ClaimCreate,
    current_user: dict = Depends(get_current_user)
):
    """Student submits an ownership claim for a found item."""
    user_id = str(current_user["_id"])
    claim = await claim_service.submit_claim(
        claimant_user_id=user_id,
        lost_item_id=req.lost_item_id,
        found_item_id=req.found_item_id,
        proof_description=req.proof_description,
        proof_answers=req.proof_answers
    )
    return ClaimResponse(**claim)

@router.get("/my-claims", response_model=List[ClaimResponse])
async def get_my_claims(current_user: dict = Depends(get_current_user)):
    """Retrieve all claims submitted by the authenticated student."""
    user_id = str(current_user["_id"])
    claims = await claim_service.get_user_claims(user_id)
    return [ClaimResponse(**c) for c in claims]
