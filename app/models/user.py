from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from app.core.security import UserRole
from app.models.base import BaseDocument, parse_date, parse_uuid


class User(BaseDocument):
    collection_name = "users"

    def __init__(self, **kwargs: Any) -> None:
        self.name: str = kwargs.pop("name", "")
        self.email: str = (kwargs.pop("email", "") or "").lower()
        self.phone: str | None = kwargs.pop("phone", None) or kwargs.pop("phone_number", None)
        self.password_hash: str = kwargs.pop("password_hash", "") or kwargs.pop("hashed_password", "")
        role_val = kwargs.pop("role", UserRole.MOTHER)
        self.role: UserRole = role_val if isinstance(role_val, UserRole) else UserRole(role_val)
        self.preferred_language: str = kwargs.pop("preferred_language", "en")
        self.is_active: bool = kwargs.pop("is_active", True)
        self.is_verified: bool = kwargs.pop("is_verified", False)
        super().__init__(**kwargs)

    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, value: str) -> None:
        self.name = value

    @property
    def phone_number(self) -> str | None:
        return self.phone

    @phone_number.setter
    def phone_number(self, value: str | None) -> None:
        self.phone = value

    @property
    def hashed_password(self) -> str:
        return self.password_hash

    @hashed_password.setter
    def hashed_password(self, value: str) -> None:
        self.password_hash = value

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> User | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "role" in doc_copy and not isinstance(doc_copy["role"], UserRole):
            try:
                doc_copy["role"] = UserRole(doc_copy["role"])
            except Exception:
                doc_copy["role"] = UserRole.MOTHER
        return cls(**doc_copy)


class MotherProfile(BaseDocument):
    collection_name = "mother_profiles"

    def __init__(self, **kwargs: Any) -> None:
        self.user_id: uuid.UUID = parse_uuid(kwargs.pop("user_id", None)) or uuid.uuid4()
        self.age: int | None = kwargs.pop("age", None)
        self.weight: float | None = kwargs.pop("weight", None)
        self.height: float | None = kwargs.pop("height", None)
        self.pregnancy_status: str | None = kwargs.pop("pregnancy_status", None)
        self.delivery_date: date | None = parse_date(kwargs.pop("delivery_date", None))
        self.blood_group: str | None = kwargs.pop("blood_group", None)
        self.emergency_contact: str | None = kwargs.pop("emergency_contact", None)
        self.district: str | None = kwargs.pop("district", None)
        self.village: str | None = kwargs.pop("village", None)
        super().__init__(**kwargs)

    @classmethod
    def from_mongo(cls, doc: dict[str, Any] | None) -> MotherProfile | None:
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = parse_uuid(doc_copy.pop("_id"))
        if "user_id" in doc_copy:
            doc_copy["user_id"] = parse_uuid(doc_copy["user_id"])
        if "delivery_date" in doc_copy:
            doc_copy["delivery_date"] = parse_date(doc_copy["delivery_date"])
        return cls(**doc_copy)