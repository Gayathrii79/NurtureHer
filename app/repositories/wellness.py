from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID
import pymongo

from app.models.nutrition import HydrationLog
from app.models.wellness import Cycle, Journal, Mood, Symptom
from app.repositories.base import BaseRepository


class MoodRepository(BaseRepository[Mood]):
    model = Mood

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[Mood]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def latest_for_user(self, user_id: UUID | str) -> Mood | None:
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class SymptomRepository(BaseRepository[Symptom]):
    model = Symptom

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[Symptom]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def latest_for_user(self, user_id: UUID | str) -> Symptom | None:
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class JournalRepository(BaseRepository[Journal]):
    model = Journal

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[Journal]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


class CycleRepository(BaseRepository[Cycle]):
    model = Cycle

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[Cycle]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def latest_for_user(self, user_id: UUID | str) -> Cycle | None:
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class HydrationRepository(BaseRepository[HydrationLog]):
    model = HydrationLog

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[HydrationLog]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("log_date", pymongo.DESCENDING)],
        )

    async def for_date(self, user_id: UUID | str, log_date: date | str) -> HydrationLog | None:
        date_str = log_date.isoformat() if isinstance(log_date, date) else str(log_date)
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "log_date": date_str, "deleted_at": None}
        )
        return self.model.from_mongo(doc)


async def wellness_counts(db: Any, user_id: UUID | str) -> dict[str, int]:
    uid = str(user_id)
    mood_col = getattr(db, "moods", None) or db["moods"]
    symptom_col = getattr(db, "symptoms", None) or db["symptoms"]
    journal_col = getattr(db, "journals", None) or db["journals"]

    mood_count = await mood_col.count_documents({"user_id": uid, "deleted_at": None})
    symptom_count = await symptom_col.count_documents({"user_id": uid, "deleted_at": None})
    journal_count = await journal_col.count_documents({"user_id": uid, "deleted_at": None})

    return {
        "mood_entries": mood_count,
        "symptom_entries": symptom_count,
        "journal_entries": journal_count,
    }