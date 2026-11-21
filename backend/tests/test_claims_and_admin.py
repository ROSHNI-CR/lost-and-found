import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from app.services.claim_service import ClaimService
from app.services.notification_service import NotificationService
from app.services.analytics_service import AnalyticsService

@pytest.mark.asyncio
async def test_claim_submission_and_status_update(setup_test_environment):
    lost_id = "664fa1e2b83a000000000010"
    found_id = "664fa1e2b83a000000000020"
    claimant_id = "664fa1e2b83a000000000001"

    mock_db = setup_test_environment
    mock_db.found_items.find_one = AsyncMock(return_value={
        "_id": ObjectId(found_id), "title": "Flask", "status": "available"
    })
    mock_db.lost_items.find_one = AsyncMock(return_value={
        "_id": ObjectId(lost_id), "title": "Water bottle", "user_id": claimant_id, "status": "active"
    })
    mock_db.claims.find_one = AsyncMock(return_value=None)
    mock_db.claims.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId("664fa1e2b83a000000000030")))
    mock_db.notifications.find_one = AsyncMock(return_value=None)
    mock_db.notifications.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId("664fa1e2b83a000000000040")))
    mock_db.audit_logs.insert_one = AsyncMock()

    claim = await ClaimService.submit_claim(
        claimant_user_id=claimant_id,
        lost_item_id=lost_id,
        found_item_id=found_id,
        proof_description="Has a small dent on the bottom and a NASA sticker on the side."
    )

    assert claim["status"] == "pending"
    assert claim["claimant_user_id"] == claimant_id
    
    # Verify items were transitioned to claim_pending
    mock_db.lost_items.update_one.assert_called_with(
        {"_id": ObjectId(lost_id)}, {"$set": {"status": "claim_pending"}}
    )
    mock_db.found_items.update_one.assert_called_with(
        {"_id": ObjectId(found_id)}, {"$set": {"status": "claim_pending"}}
    )

@pytest.mark.asyncio
async def test_claim_approval_recovers_item(setup_test_environment):
    claim_id = "664fa1e2b83a000000000030"
    lost_id = "664fa1e2b83a000000000010"
    found_id = "664fa1e2b83a000000000020"
    claimant_id = "664fa1e2b83a000000000001"
    admin_id = "664fa1e2b83a000000000002"

    mock_db = setup_test_environment
    mock_db.claims.find_one = AsyncMock(side_effect=[
        {
            "_id": ObjectId(claim_id),
            "lost_item_id": lost_id,
            "found_item_id": found_id,
            "claimant_user_id": claimant_id,
            "status": "pending"
        },
        {
            "_id": ObjectId(claim_id),
            "lost_item_id": lost_id,
            "found_item_id": found_id,
            "claimant_user_id": claimant_id,
            "status": "approved",
            "admin_feedback": "Sticker verified in person."
        }
    ])
    mock_db.notifications.find_one = AsyncMock(return_value=None)
    mock_db.notifications.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId("664fa1e2b83a000000000041")))
    mock_db.audit_logs.insert_one = AsyncMock()

    reviewed = await ClaimService.review_claim(
        claim_id=claim_id,
        admin_user_id=admin_id,
        new_status="approved",
        admin_feedback="Sticker verified in person."
    )

    assert reviewed["status"] == "approved"
    
    # Verify status transitions
    mock_db.lost_items.update_one.assert_called_with(
        {"_id": ObjectId(lost_id)}, {"$set": {"status": "recovered"}}
    )
    mock_db.found_items.update_one.assert_called_with(
        {"_id": ObjectId(found_id)}, {"$set": {"status": "claimed"}}
    )

@pytest.mark.asyncio
async def test_notification_deduplication(setup_test_environment):
    user_id = "664fa1e2b83a000000000001"
    mock_db = setup_test_environment
    
    # First notification succeeds
    mock_db.notifications.find_one = AsyncMock(return_value=None)
    mock_db.notifications.insert_one = AsyncMock(return_value=AsyncMock(inserted_id=ObjectId("664fa1e2b83a000000000050")))

    notif1 = await NotificationService.create_notification(
        user_id=user_id,
        title="Match Found",
        message="Item matched",
        notification_type="potential_match",
        related_item_id="664fa1e2b83a000000000010"
    )
    assert notif1 is not None

    # Second duplicate notification within cutoff is suppressed
    mock_db.notifications.find_one = AsyncMock(return_value={"_id": "existing"})
    notif2 = await NotificationService.create_notification(
        user_id=user_id,
        title="Match Found",
        message="Item matched",
        notification_type="potential_match",
        related_item_id="664fa1e2b83a000000000010"
    )
    assert notif2 is None

@pytest.mark.asyncio
async def test_analytics_zero_denominator_safety(setup_test_environment):
    mock_db = setup_test_environment
    mock_db.users.count_documents = AsyncMock(return_value=0)
    mock_db.lost_items.count_documents = AsyncMock(return_value=0)
    mock_db.found_items.count_documents = AsyncMock(return_value=0)
    mock_db.claims.count_documents = AsyncMock(return_value=0)
    mock_db.matches.count_documents = AsyncMock(return_value=0)
    mock_db.lost_items.aggregate = MagicMock(return_value=AsyncMock(to_list=AsyncMock(return_value=[])))
    mock_db.found_items.aggregate = MagicMock(return_value=AsyncMock(to_list=AsyncMock(return_value=[])))

    stats = await AnalyticsService.get_dashboard_analytics()
    assert stats["recovery_rate"] == 0.0
    assert stats["total_lost"] == 0
    assert stats["total_found"] == 0
