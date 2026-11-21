import logging
from pymongo import ASCENDING, DESCENDING, TEXT
from app.database.connection import get_database

logger = logging.getLogger("findit.indexes")

async def create_indexes():
    db = get_database()
    logger.info("Configuring MongoDB indexes...")

    try:
        # Users indexes
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("role", ASCENDING)])
        await db.users.create_index([("student_id", ASCENDING)], sparse=True)

        # Lost items indexes
        await db.lost_items.create_index([("user_id", ASCENDING)])
        await db.lost_items.create_index([("status", ASCENDING)])
        await db.lost_items.create_index([("category", ASCENDING)])
        await db.lost_items.create_index([("approximate_date_lost", DESCENDING)])
        await db.lost_items.create_index([("created_at", DESCENDING)])
        await db.lost_items.create_index([("title", TEXT), ("description", TEXT), ("location_lost", TEXT)])

        # Found items indexes
        await db.found_items.create_index([("user_id", ASCENDING)])
        await db.found_items.create_index([("status", ASCENDING)])
        await db.found_items.create_index([("category", ASCENDING)])
        await db.found_items.create_index([("date_found", DESCENDING)])
        await db.found_items.create_index([("created_at", DESCENDING)])
        await db.found_items.create_index([("title", TEXT), ("description", TEXT), ("location_found", TEXT)])

        # Matches indexes
        await db.matches.create_index([("lost_item_id", ASCENDING), ("found_item_id", ASCENDING)], unique=True)
        await db.matches.create_index([("final_score", DESCENDING)])
        await db.matches.create_index([("match_status", ASCENDING)])
        await db.matches.create_index([("created_at", DESCENDING)])

        # Claims indexes
        await db.claims.create_index([("claimant_user_id", ASCENDING)])
        await db.claims.create_index([("found_item_id", ASCENDING)])
        await db.claims.create_index([("lost_item_id", ASCENDING)])
        await db.claims.create_index([("status", ASCENDING)])
        await db.claims.create_index([("created_at", DESCENDING)])

        # Notifications indexes
        await db.notifications.create_index([("user_id", ASCENDING), ("is_read", ASCENDING)])
        await db.notifications.create_index([("created_at", DESCENDING)])

        # Conversations indexes
        await db.conversations.create_index([("user_id", ASCENDING)])
        await db.conversations.create_index([("updated_at", DESCENDING)])

        # Audit logs indexes
        await db.audit_logs.create_index([("actor_user_id", ASCENDING)])
        await db.audit_logs.create_index([("action", ASCENDING)])
        await db.audit_logs.create_index([("created_at", DESCENDING)])

        logger.info("MongoDB indexes successfully created.")
    except Exception as e:
        logger.warning(f"Error while creating MongoDB indexes (may already exist): {e}")
