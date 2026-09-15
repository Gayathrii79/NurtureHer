from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from app.models.base import BaseDocument, parse_datetime, parse_uuid
from app.models.enums import CaseStatus, RiskLevel


class HighRiskCase(BaseDocument):
    collection_name = "high_risk_cases"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.risk_type: str = kwargs.pop("risk_type", None) or kwargs.pop("source", "clinical")
        risk_val = kwargs.pop("risk_level", RiskLevel.HIGH)
        self.risk_level: RiskLevel = risk_val if isinstance(risk_val, RiskLevel) else RiskLevel(risk_val)
        raw_worker = kwargs.pop("assigned_worker_id", None)
        self.assigned_worker_id: uuid.UUID | None = parse_uuid(raw_worker) if raw_worker else None
        status_val = kwargs.pop("status", CaseStatus.OPEN)
        self.status: CaseStatus = status_val if isinstance(status_val, CaseStatus) else CaseStatus(status_val)
        super().__init__(**kwargs)

    @property
    def source(self) -> str:
        return self.risk_type

    @source.setter
    def source(self, value: str) -> None:
        self.risk_type = value

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> HighRiskCase | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "assigned_worker_id" in doc_copy and doc_copy["assigned_worker_id"]:
            doc_copy["assigned_worker_id"] = parse_uuid(doc_copy["assigned_worker_id"])
        if "risk_level" in doc_copy and not isinstance(doc_copy["risk_level"], RiskLevel):
            try:
                doc_copy["risk_level"] = RiskLevel(doc_copy["risk_level"])
            except Exception:
                doc_copy["risk_level"] = RiskLevel.HIGH
        if "status" in doc_copy and not isinstance(doc_copy["status"], CaseStatus):
            try:
                doc_copy["status"] = CaseStatus(doc_copy["status"])
            except Exception:
                doc_copy["status"] = CaseStatus.OPEN
        return cls(**doc_copy)


class Alert(BaseDocument):
    collection_name = "alerts"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.message: str = kwargs.pop("message", "")
        self.sent_status: str = kwargs.pop("sent_status", None) or kwargs.pop("status", "queued")
        self.sent_at: datetime | None = parse_datetime(kwargs.pop("sent_at", None))
        super().__init__(**kwargs)

    @property
    def status(self) -> str:
        return self.sent_status

    @property
    def channel(self) -> str:
        return "sms"

    @property
    def recipient(self) -> str:
        return getattr(self, "phone", "unavailable")

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Alert | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "sent_at" in doc_copy:
            doc_copy["sent_at"] = parse_datetime(doc_copy["sent_at"])
        return cls(**doc_copy)