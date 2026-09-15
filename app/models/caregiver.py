from __future__ import annotations

from typing import Any

from app.models.base import BaseDocument, parse_uuid


class CaregiverContent(BaseDocument):
    collection_name = "caregiver_content"

    def __init__(self, **kwargs: Any) -> None:
        self.title: str = kwargs.pop("title", "")
        self.description: str = kwargs.pop("description", "")
        self.video_url: str | None = kwargs.pop("video_url", None)
        self.category: str = kwargs.pop("category", "tip")
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> CaregiverContent | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        return cls(**doc_copy)