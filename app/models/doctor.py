from __future__ import annotations

import uuid
from typing import Any

from app.models.base import BaseDocument, parse_uuid


class DoctorPatient(BaseDocument):
    collection_name = "doctor_patients"

    def __init__(self, **kwargs: Any) -> None:
        self.doctor_id: uuid.UUID = parse_uuid(kwargs.pop("doctor_id", None)) or uuid.uuid4()
        self.patient_id: uuid.UUID = parse_uuid(kwargs.pop("patient_id", None)) or uuid.uuid4()
        self.status: str = kwargs.pop("status", "active")
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> DoctorPatient | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "doctor_id" in doc_copy:
            doc_copy["doctor_id"] = parse_uuid(doc_copy["doctor_id"])
        if "patient_id" in doc_copy:
            doc_copy["patient_id"] = parse_uuid(doc_copy["patient_id"])
        return cls(**doc_copy)


class DoctorNote(BaseDocument):
    collection_name = "doctor_notes"

    def __init__(self, **kwargs: Any) -> None:
        self.doctor_id: uuid.UUID = parse_uuid(kwargs.pop("doctor_id", None)) or uuid.uuid4()
        self.patient_id: uuid.UUID = parse_uuid(kwargs.pop("patient_id", None)) or uuid.uuid4()
        self.clinical_observations: str = kwargs.pop("clinical_observations", "")
        self.follow_up_recommendation: str | None = kwargs.pop("follow_up_recommendation", None)
        self.prescribed_advice: str | None = kwargs.pop("prescribed_advice", None)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> DoctorNote | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "doctor_id" in doc_copy:
            doc_copy["doctor_id"] = parse_uuid(doc_copy["doctor_id"])
        if "patient_id" in doc_copy:
            doc_copy["patient_id"] = parse_uuid(doc_copy["patient_id"])
        return cls(**doc_copy)