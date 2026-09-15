from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Any
import uuid


def parse_datetime(val: Any) -> datetime | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val
    if isinstance(val, date):
        return datetime(val.year, val.month, val.day, tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val)
        except Exception:
            return None
    return None


def parse_date(val: Any) -> date | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return date.fromisoformat(val.split("T")[0])
        except Exception:
            return None
    return None


def parse_uuid(val: Any) -> uuid.UUID | None:
    if val is None:
        return None
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return None


class BaseDocument:
    collection_name: str = ""

    def __init__(self, **kwargs: Any) -> None:
        raw_id = kwargs.pop("id", None) or kwargs.pop("_id", None) or uuid.uuid4()
        self.id = parse_uuid(raw_id) or uuid.uuid4()

        raw_created_at = kwargs.pop("created_at", None)
        self.created_at = parse_datetime(raw_created_at) or datetime.now(timezone.utc)

        raw_updated_at = kwargs.pop("updated_at", None)
        self.updated_at = parse_datetime(raw_updated_at) or datetime.now(timezone.utc)

        raw_deleted_at = kwargs.pop("deleted_at", None)
        self.deleted_at = parse_datetime(raw_deleted_at)

        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_mongo(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "_id": str(self.id),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "deleted_at": self.deleted_at,
        }
        for key, val in self.__dict__.items():
            if key in ("id", "created_at", "updated_at", "deleted_at"):
                continue
            if isinstance(val, Enum):
                data[key] = val.value
            elif isinstance(val, uuid.UUID):
                data[key] = str(val)
            elif isinstance(val, (datetime, date)):
                data[key] = val.isoformat() if isinstance(val, date) and not isinstance(val, datetime) else val
            else:
                data[key] = val
        return data

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Any:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        return cls(**doc_copy)

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def __setitem__(self, key: str, value: Any) -> None:
        setattr(self, key, value)

    def get(self, item: str, default: Any = None) -> Any:
        return getattr(self, item, default)

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"