from __future__ import annotations

from uuid import UUID

from app.models.user import MotherProfile
from app.repositories.base import BaseRepository


class MotherProfileRepository(BaseRepository[MotherProfile]):
    model = MotherProfile

    async def get_by_user_id(self, user_id: UUID | str) -> MotherProfile | None:
        if not user_id:
            return None
        doc = await self.collection.find_one({"user_id": str(user_id), "deleted_at": None})
        if not doc:
            return None
        return self.model.from_mongo(doc)