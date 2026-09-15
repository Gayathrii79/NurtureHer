from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from app.models.base import BaseDocument, parse_datetime, parse_uuid


class AuditLog(BaseDocument):
    collection_name = "audit_logs"

    def __init__(self, **kwargs: Any) -> None:
        raw_user = kwargs.pop("user_id", None)
        self.user_id: uuid.UUID | None = parse_uuid(raw_user) if raw_user else None
        self.action: str = kwargs.pop("action", "")
        self.resource: str = kwargs.pop("resource", "")
        self.ip_address: str | None = kwargs.pop("ip_address", None)
        self.user_agent: str | None = kwargs.pop("user_agent", None)
        self.metadata_json: str | None = kwargs.pop("metadata_json", None)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> AuditLog | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy and doc_copy["user_id"]:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        return cls(**doc_copy)


class RefreshToken(BaseDocument):
    collection_name = "refresh_tokens"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.token_jti: str = kwargs.pop("token_jti", "")
        self.expires_at: datetime = parse_datetime(kwargs.pop("expires_at", None))
        self.revoked_at: datetime | None = parse_datetime(kwargs.pop("revoked_at", None))
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> RefreshToken | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "expires_at" in doc_copy:
            doc_copy["expires_at"] = parse_datetime(doc_copy["expires_at"])
        if "revoked_at" in doc_copy and doc_copy["revoked_at"]:
            doc_copy["revoked_at"] = parse_datetime(doc_copy["revoked_at"])
        return cls(**doc_copy)