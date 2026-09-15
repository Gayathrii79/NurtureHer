from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Any

from app.models.base import BaseDocument, parse_date, parse_uuid
from app.models.enums import MoodOption


class Mood(BaseDocument):
    collection_name = "moods"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        mood_val = kwargs.pop("mood", MoodOption.HAPPY)
        self.mood: MoodOption = mood_val if isinstance(mood_val, MoodOption) else MoodOption(mood_val)
        self.note: str | None = kwargs.pop("note", None)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Mood | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "mood" in doc_copy and not isinstance(doc_copy["mood"], MoodOption):
            try:
                doc_copy["mood"] = MoodOption(doc_copy["mood"])
            except Exception:
                doc_copy["mood"] = MoodOption.NEUTRAL
        return cls(**doc_copy)


class Symptom(BaseDocument):
    collection_name = "symptoms"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.fatigue: bool = kwargs.pop("fatigue", False)
        self.headache: bool = kwargs.pop("headache", False)
        self.sleep_issue: bool = kwargs.pop("sleep_issue", False)
        self.anxiety: bool = kwargs.pop("anxiety", False)
        self.cramps: bool = kwargs.pop("cramps", False)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Symptom | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        return cls(**doc_copy)


class Cycle(BaseDocument):
    collection_name = "cycles"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.last_period_date: date = parse_date(kwargs.pop("last_period_date", None)) or date.today()
        self.cycle_length: int = kwargs.pop("cycle_length", 28)
        raw_next = kwargs.pop("next_period_prediction", None)
        self.next_period_prediction: date = parse_date(raw_next) or (self.last_period_date + timedelta(days=self.cycle_length))
        super().__init__(**kwargs)

    @classmethod
    def predicted_date(cls, last_period_date: date, cycle_length: int) -> date:
        return last_period_date + timedelta(days=cycle_length)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Cycle | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "last_period_date" in doc_copy:
            doc_copy["last_period_date"] = parse_date(doc_copy["last_period_date"])
        if "next_period_prediction" in doc_copy:
            doc_copy["next_period_prediction"] = parse_date(doc_copy["next_period_prediction"])
        return cls(**doc_copy)


class Journal(BaseDocument):
    collection_name = "journals"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.title: str = kwargs.pop("title", "")
        self.content: str = kwargs.pop("content", "")
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> Journal | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        return cls(**doc_copy)