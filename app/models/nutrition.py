from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from app.models.base import BaseDocument, parse_date, parse_uuid


class NutritionPlan(BaseDocument):
    collection_name = "nutrition_plans"

    def __init__(self, **kwargs: Any) -> None:
        self.category: str = kwargs.pop("category", "general")
        self.title: str = kwargs.pop("title", "")
        self.phase: str | None = kwargs.pop("phase", None)
        self.meal_type: str = kwargs.pop("meal_type", "breakfast")
        self.description: str = kwargs.pop("description", "")
        self.local_foods: str = kwargs.pop("local_foods", "")
        self.key_nutrients: str = kwargs.pop("key_nutrients", "")
        self.is_affordable_local: bool = kwargs.pop("is_affordable_local", True)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> NutritionPlan | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        return cls(**doc_copy)


class HydrationLog(BaseDocument):
    collection_name = "hydration_logs"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.log_date: date = parse_date(kwargs.pop("log_date", None)) or date.today()
        self.cups: int = kwargs.pop("cups", 0)
        self.target_cups: int = kwargs.pop("target_cups", 8)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> HydrationLog | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "log_date" in doc_copy:
            doc_copy["log_date"] = parse_date(doc_copy["log_date"])
        return cls(**doc_copy)