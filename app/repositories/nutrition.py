from __future__ import annotations

from typing import Any
from uuid import UUID
import pymongo

from app.models.nutrition import HydrationLog, NutritionPlan
from app.repositories.base import BaseRepository
from app.repositories.wellness import HydrationRepository


class NutritionPlanRepository(BaseRepository[NutritionPlan]):
    model = NutritionPlan

    async def by_category(self, category: str, limit: int = 50, offset: int = 0) -> list[NutritionPlan]:
        return await self.paginated(
            filter_query={"category": category},
            limit=limit,
            offset=offset,
            sort=[("created_at", pymongo.DESCENDING)],
        )


__all__ = ["HydrationRepository", "NutritionPlanRepository"]