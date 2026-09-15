from __future__ import annotations

import re
from typing import Any
from uuid import UUID
import pymongo

from app.models.asha import Alert, HighRiskCase
from app.models.caregiver import CaregiverContent
from app.models.chat import ChatMessage
from app.models.doctor import DoctorNote, DoctorPatient
from app.models.enums import CaseStatus, RiskLevel
from app.models.pcos import PCOSPrediction
from app.models.ppd import PPDAssessment
from app.repositories.base import BaseRepository


class PCOSRepository(BaseRepository[PCOSPrediction]):
    model = PCOSPrediction

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[PCOSPrediction]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def latest_for_user(self, user_id: UUID | str) -> PCOSPrediction | None:
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class PPDRepository(BaseRepository[PPDAssessment]):
    model = PPDAssessment

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[PPDAssessment]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def latest_for_user(self, user_id: UUID | str) -> PPDAssessment | None:
        doc = await self.collection.find_one(
            {"user_id": str(user_id), "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        return self.model.from_mongo(doc)


class ChatRepository(BaseRepository[ChatMessage]):
    model = ChatMessage

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[ChatMessage]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


class CaregiverContentRepository(BaseRepository[CaregiverContent]):
    model = CaregiverContent

    async def by_category(self, category: str, limit: int = 50, offset: int = 0) -> list[CaregiverContent]:
        return await self.paginated(
            filter_query={"category": category},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


class HighRiskRepository(BaseRepository[HighRiskCase]):
    model = HighRiskCase

    async def open_cases(
        self,
        risk_level: RiskLevel | None = None,
        status: CaseStatus | None = None,
        search: str | None = None,
        district: str | None = None,
        village: str | None = None,
        risk_type: str | None = None,
        assigned_worker_id: UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[HighRiskCase]:
        query: dict[str, Any] = {"deleted_at": None}
        if risk_level:
            query["risk_level"] = risk_level.value if isinstance(risk_level, RiskLevel) else str(risk_level)
        if status:
            query["status"] = status.value if isinstance(status, CaseStatus) else str(status)
        if risk_type:
            query["risk_type"] = str(risk_type)
        if assigned_worker_id:
            query["assigned_worker_id"] = str(assigned_worker_id)

        # If filtering by patient user fields (district, village, search)
        user_col = getattr(self.db, "users", None) or self.db["users"]
        mother_col = getattr(self.db, "mother_profiles", None) or self.db["mother_profiles"]

        user_filter: dict[str, Any] = {}
        if search:
            rgx = re.compile(re.escape(search), re.IGNORECASE)
            user_filter["$or"] = [{"name": rgx}, {"email": rgx}, {"phone": rgx}]
        if user_filter:
            user_ids = [str(d["_id"]) for d in await user_col.find(user_filter, {"_id": 1}).to_list(1000)]
            query["user_id"] = {"$in": user_ids}

        if district or village:
            prof_filter: dict[str, Any] = {}
            if district:
                prof_filter["district"] = re.compile(re.escape(district), re.IGNORECASE)
            if village:
                prof_filter["village"] = re.compile(re.escape(village), re.IGNORECASE)
            prof_ids = [str(d["user_id"]) for d in await mother_col.find(prof_filter, {"user_id": 1}).to_list(1000)]
            if "user_id" in query and "$in" in query["user_id"]:
                query["user_id"]["$in"] = list(set(query["user_id"]["$in"]).intersection(prof_ids))
            else:
                query["user_id"] = {"$in": prof_ids}

        cursor = self.collection.find(query).sort("created_at", pymongo.DESCENDING).skip(offset).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model.from_mongo(doc) for doc in docs if doc]


class AlertRepository(BaseRepository[Alert]):
    model = Alert

    async def for_user(self, user_id: UUID | str, limit: int = 50, offset: int = 0) -> list[Alert]:
        return await self.paginated(
            filter_query={"user_id": str(user_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )

    async def all_alerts(self, status: str | None = None, limit: int = 50, offset: int = 0) -> list[Alert]:
        query: dict[str, Any] = {}
        if status:
            query["sent_status"] = status
        return await self.paginated(
            filter_query=query,
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


class DoctorPatientRepository(BaseRepository[DoctorPatient]):
    model = DoctorPatient

    async def for_doctor(self, doctor_id: UUID | str, limit: int = 50, offset: int = 0) -> list[DoctorPatient]:
        return await self.paginated(
            filter_query={"doctor_id": str(doctor_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


class DoctorNoteRepository(BaseRepository[DoctorNote]):
    model = DoctorNote

    async def for_patient(self, patient_id: UUID | str, limit: int = 50, offset: int = 0) -> list[DoctorNote]:
        return await self.paginated(
            filter_query={"patient_id": str(patient_id)},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )