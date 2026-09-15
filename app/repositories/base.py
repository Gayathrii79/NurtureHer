from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Generic, TypeVar
from uuid import UUID

from app.core.database import MongoDatabaseWrapper

ModelT = TypeVar("ModelT")


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: MongoDatabaseWrapper | Any) -> None:
        self.db = db
        collection_name = getattr(self.model, "collection_name", None) or f"{self.model.__name__.lower()}s"
        self.collection = getattr(db, collection_name, None)
        if self.collection is None and hasattr(db, "get_collection"):
            self.collection = db.get_collection(collection_name)
        elif self.collection is None and hasattr(db, "__getitem__"):
            self.collection = db[collection_name]

    async def get(self, obj_id: UUID | str) -> ModelT | None:
        if not obj_id:
            return None
        doc = await self.collection.find_one({"_id": str(obj_id), "deleted_at": None})
        if not doc:
            return None
        return self.model.from_mongo(doc)

    async def list(self, filter_query: dict[str, Any] | None = None, sort: list[tuple[str, int]] | None = None) -> list[ModelT]:
        query: dict[str, Any] = {"deleted_at": None}
        if isinstance(filter_query, dict):
            query.update(filter_query)
        cursor = self.collection.find(query)
        if sort:
            cursor = cursor.sort(sort)
        docs = await cursor.to_list(length=1000)
        return [self.model.from_mongo(doc) for doc in docs if doc]

    async def paginated(
        self,
        filter_query: dict[str, Any] | None = None,
        limit: int = 50,
        offset: int = 0,
        sort: list[tuple[str, int]] | None = None,
    ) -> list[ModelT]:
        query: dict[str, Any] = {"deleted_at": None}
        if isinstance(filter_query, dict):
            query.update(filter_query)
        cursor = self.collection.find(query)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(offset).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self.model.from_mongo(doc) for doc in docs if doc]

    async def create(self, **data: Any) -> ModelT:
        obj = self.model(**data)
        doc = obj.to_mongo()
        await self.collection.insert_one(doc)
        return obj

    async def update(self, obj: ModelT, **data: Any) -> ModelT:
        for key, value in data.items():
            if value is not None:
                setattr(obj, key, value)
        obj.updated_at = datetime.now(timezone.utc)
        doc = obj.to_mongo()
        await self.collection.update_one({"_id": str(obj.id)}, {"$set": doc})
        return obj

    async def delete(self, obj: ModelT, soft: bool = True) -> None:
        if soft:
            now = datetime.now(timezone.utc)
            setattr(obj, "deleted_at", now)
            await self.collection.update_one({"_id": str(obj.id)}, {"$set": {"deleted_at": now}})
        else:
            await self.collection.delete_one({"_id": str(obj.id)})