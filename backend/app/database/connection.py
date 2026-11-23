import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from app.core.config import settings

logger = logging.getLogger("findit.database")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    sync_client: MongoClient = None

db_instance = Database()

async def connect_to_mongo():
    uri = getattr(settings, 'MONGODB_URL', None) or settings.MONGODB_URI
    logger.info(f"Connecting to MongoDB at {uri[:25]}...")
    try:
        db_instance.client = AsyncIOMotorClient(
            uri,
            serverSelectionTimeoutMS=3000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        # Ping the server to verify connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: '{settings.DATABASE_NAME}'")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # Note: Do not crash entire process if MongoDB is momentarily restarting, but raise or log
        raise e

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        # Fallback initialization if accessed outside lifespan
        uri = getattr(settings, 'MONGODB_URL', None) or settings.MONGODB_URI
        db_instance.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=3000)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
    return db_instance.db
