from __future__ import annotations

from typing import Any
import pymongo

from app.core.security import UserRole
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        if not email:
            return None
        doc = await self.collection.find_one({"email": email.strip().lower(), "deleted_at": None})
        if not doc:
            return None
        return self.model.from_mongo(doc)

    async def asha_workers(self, district: str | None = None, limit: int = 20) -> list[User]:
        query: dict[str, Any] = {
            "role": UserRole.ASHA_WORKER.value,
            "is_active": True,
            "deleted_at": None,
        }
        cursor = self.collection.find(query).sort("created_at", pymongo.ASCENDING).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model.from_mongo(doc) for doc in docs if doc]