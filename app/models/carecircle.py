from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.models.base import BaseDocument, parse_datetime, parse_uuid


class CareCircleQR(BaseDocument):
    collection_name = "carecircle_qrs"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.token: str = kwargs.pop("token", "")
        self.expires_at: datetime = parse_datetime(kwargs.pop("expires_at", None)) or (datetime.now(timezone.utc) + timedelta(days=30))
        super().__init__(**kwargs)

    @classmethod
    def create_token(cls, user_id: uuid.UUID, valid_days: int = 30) -> CareCircleQR:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=valid_days)
        return cls(user_id=user_id, token=token, expires_at=expires_at)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> CareCircleQR | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "expires_at" in doc_copy:
            doc_copy["expires_at"] = parse_datetime(doc_copy["expires_at"])
        return cls(**doc_copy)


class CareCircleAccess(BaseDocument):
    collection_name = "carecircle_access"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.requester_id: uuid.UUID = parse_uuid(kwargs.pop("requester_id", None)) or uuid.uuid4()
        self.relationship_label: str = kwargs.pop("relationship_label", "Caregiver")
        self.status: str = kwargs.pop("status", "pending")
        self.share_emergency: bool = kwargs.pop("share_emergency", True)
        self.share_risk_category: bool = kwargs.pop("share_risk_category", True)
        self.share_wellness_summary: bool = kwargs.pop("share_wellness_summary", True)
        self.share_doctor_notes: bool = kwargs.pop("share_doctor_notes", False)
        self.requested_at: datetime = parse_datetime(kwargs.pop("requested_at", None)) or datetime.now(timezone.utc)
        self.responded_at: datetime | None = parse_datetime(kwargs.pop("responded_at", None))
        self.revoked_at: datetime | None = parse_datetime(kwargs.pop("revoked_at", None))
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> CareCircleAccess | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "requester_id" in doc_copy:
            doc_copy["requester_id"] = parse_uuid(doc_copy["requester_id"])
        if "requested_at" in doc_copy:
            doc_copy["requested_at"] = parse_datetime(doc_copy["requested_at"])
        if "responded_at" in doc_copy:
            doc_copy["responded_at"] = parse_datetime(doc_copy["responded_at"])
        if "revoked_at" in doc_copy:
            doc_copy["revoked_at"] = parse_datetime(doc_copy["revoked_at"])
        return cls(**doc_copy)