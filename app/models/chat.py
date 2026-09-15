from __future__ import annotations

import uuid
from typing import Any

from app.models.base import BaseDocument, parse_uuid


class ChatMessage(BaseDocument):
    collection_name = "chat_messages"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.message: str = kwargs.pop("message", "")
        self.response: str = kwargs.pop("response", "")
        self.language: str = kwargs.pop("language", "en")
        self.retrieved_sources: list[dict[str, Any]] = kwargs.pop("retrieved_sources", [])
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> ChatMessage | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        return cls(**doc_copy)