from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID
import pymongo

from app.models.audit import AuditLog, RefreshToken
from app.models.carecircle import CareCircleAccess, CareCircleQR
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    model = AuditLog


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    model = RefreshToken

    async def get_by_jti(self, token_jti: str) -> RefreshToken | None:
        if not token_jti:
            return None
        doc = await self.collection.find_one({"token_jti": token_jti, "deleted_at": None})
        return self.model.from_mongo(doc)

    async def active_for_user(self, user_id: UUID | str) -> list[RefreshToken]:
        query = {
            "user_id": str(user_id),
            "revoked_at": None,
            "deleted_at": None,
        }
        docs = await self.collection.find(query).to_list(length=100)
        return [self.model.from_mongo(doc) for doc in docs if doc]


class CareCircleQRRepository(BaseRepository[CareCircleQR]):
    model = CareCircleQR

    async def get_by_token(self, token: str) -> CareCircleQR | None:
        if not token:
            return None
        doc = await self.collection.find_one({"token": token, "deleted_at": None})
        return self.model.from_mongo(doc)

    async def active_for_user(self, user_id: UUID | str) -> CareCircleQR | None:
        doc = await self.collection.find_one(
            {
                "user_id": str(user_id),
                "expires_at": {"$gt": datetime.now(timezone.utc)},
                "deleted_at": None,
            },
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class CareCircleAccessRepository(BaseRepository[CareCircleAccess]):
    model = CareCircleAccess

    async def for_mother(self, user_id: UUID | str) -> list[CareCircleAccess]:
        return await self.list(
            filter_query={"user_id": str(user_id)},
            sort=[("requested_at", pymongo.DESCENDING)],
        )

    async def for_caregiver(self, requester_id: UUID | str) -> list[CareCircleAccess]:
        return await self.list(
            filter_query={"requester_id": str(requester_id)},
            sort=[("requested_at", pymongo.DESCENDING)],
        )