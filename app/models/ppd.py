from __future__ import annotations

import uuid
from typing import Any

from app.models.base import BaseDocument, parse_uuid
from app.models.enums import RiskLevel


class PPDAssessment(BaseDocument):
    collection_name = "ppd_assessments"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.epds_score: int = int(kwargs.pop("epds_score", 0))
        self.sentiment: str = kwargs.pop("sentiment", "")
        risk_val = kwargs.pop("risk_level", RiskLevel.LOW)
        self.risk_level: RiskLevel = risk_val if isinstance(risk_val, RiskLevel) else RiskLevel(risk_val)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> PPDAssessment | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "risk_level" in doc_copy and not isinstance(doc_copy["risk_level"], RiskLevel):
            try:
                doc_copy["risk_level"] = RiskLevel(doc_copy["risk_level"])
            except Exception:
                doc_copy["risk_level"] = RiskLevel.LOW
        return cls(**doc_copy)