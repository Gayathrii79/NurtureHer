from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any
import uuid

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo

from app.core.config import settings

logger = logging.getLogger(__name__)

_mongo_client: AsyncIOMotorClient | None = None
_is_mock: bool = False


class Base:
    """Base class for models with timestamp and soft-deletion tracking."""
    updated_at: datetime | None = None
    deleted_at: datetime | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client, _is_mock
    if _mongo_client is not None:
        return _mongo_client

    mongo_url = getattr(settings, "mongodb_url", "mongodb://localhost:27017")
    try:
        # Attempt connecting to live MongoDB
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=2000,
            uuidRepresentation="standard",
        )
        client.get_io_loop()
        _mongo_client = client
        _is_mock = False
        logger.info("Connected to MongoDB at %s", mongo_url)
    except Exception as exc:
        logger.warning("Could not connect to live MongoDB (%s). Using in-memory mongomock fallback: %s", mongo_url, exc)
        try:
            import mongomock_motor
            _mongo_client = mongomock_motor.AsyncIOMotorClient()
            _is_mock = True
        except ImportError:
            raise RuntimeError("Neither MongoDB nor mongomock-motor is available") from exc

    return _mongo_client


class MongoDatabaseWrapper:
    """
    Asynchronous MongoDB Database Wrapper providing clean collection access,
    helper utilities, and backward-compatible session methods (commit, flush, refresh).
    """

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db

    def get_collection(self, name: str):
        return self.db[name]

    def __getitem__(self, name: str):
        return self.db[name]

    def __getattr__(self, name: str):
        return self.db[name]

    @property
    def users(self):
        return self.db["users"]

    @property
    def mother_profiles(self):
        return self.db["mother_profiles"]

    @property
    def cycles(self):
        return self.db["cycles"]

    @property
    def moods(self):
        return self.db["moods"]

    @property
    def symptoms(self):
        return self.db["symptoms"]

    @property
    def journals(self):
        return self.db["journals"]

    @property
    def doctor_visit_preps(self):
        return self.db["doctor_visit_preps"]

    @property
    def nutrition_plans(self):
        return self.db["nutrition_plans"]

    @property
    def hydration_logs(self):
        return self.db["hydration_logs"]

    @property
    def pcos_predictions(self):
        return self.db["pcos_predictions"]

    @property
    def ppd_assessments(self):
        return self.db["ppd_assessments"]

    @property
    def chat_messages(self):
        return self.db["chat_messages"]

    @property
    def high_risk_cases(self):
        return self.db["high_risk_cases"]

    @property
    def alerts(self):
        return self.db["alerts"]

    @property
    def caregiver_content(self):
        return self.db["caregiver_content"]

    @property
    def carecircle_qrs(self):
        return self.db["carecircle_qrs"]

    @property
    def carecircle_access(self):
        return self.db["carecircle_access"]

    @property
    def doctor_patients(self):
        return self.db["doctor_patients"]

    @property
    def doctor_notes(self):
        return self.db["doctor_notes"]

    @property
    def audit_logs(self):
        return self.db["audit_logs"]

    @property
    def refresh_tokens(self):
        return self.db["refresh_tokens"]

    @property
    def rag_knowledge(self):
        return self.db["rag_knowledge"]

    async def command(self, cmd: Any, *args, **kwargs):
        return await self.db.command(cmd, *args, **kwargs)

    async def commit(self) -> None:
        """Compatibility no-op for session commits."""
        pass

    async def flush(self) -> None:
        """Compatibility no-op for session flushes."""
        pass

    async def refresh(self, obj: Any) -> None:
        """Compatibility no-op for session refreshes."""
        pass

    async def rollback(self) -> None:
        """Compatibility no-op for session rollbacks."""
        pass

    def add(self, obj: Any) -> None:
        """Compatibility helper for adding objects."""
        pass

    async def execute(self, statement: Any) -> Any:
        """Compatibility query runner for legacy statements."""
        return statement

    async def scalar(self, statement: Any) -> Any:
        """Compatibility query runner for legacy scalar queries."""
        return None


def get_mongo_db() -> MongoDatabaseWrapper:
    client = get_mongo_client()
    db_name = getattr(settings, "mongodb_db_name", "nurtureher")
    return MongoDatabaseWrapper(client[db_name])


async def get_db() -> AsyncGenerator[MongoDatabaseWrapper, None]:
    yield get_mongo_db()


class AsyncSessionLocalContext:
    """Async context manager wrapper mimicking AsyncSessionLocal for background tasks and tests."""
    async def __aenter__(self) -> MongoDatabaseWrapper:
        return get_mongo_db()

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        pass


def AsyncSessionLocal() -> AsyncSessionLocalContext:
    return AsyncSessionLocalContext()


class EngineContext:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def run_sync(self, fn, *args, **kwargs):
        pass


class MockEngine:
    """Mock engine to maintain lifespan and schema compatibility without SQLAlchemy table binding."""
    def begin(self):
        return EngineContext()


engine = MockEngine()


async def init_mongo_indexes() -> None:
    """Ensure key unique and query indexes exist in MongoDB."""
    try:
        db = get_mongo_db()
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
        await db.refresh_tokens.create_index([("token_jti", pymongo.ASCENDING)], unique=True)
        await db.carecircle_qrs.create_index([("token", pymongo.ASCENDING)], unique=True)
        await db.rag_knowledge.create_index([("id", pymongo.ASCENDING)], unique=True)
        logger.info("MongoDB indexes verified successfully.")
    except Exception as exc:
        logger.warning("MongoDB index initialization warning: %s", exc)
