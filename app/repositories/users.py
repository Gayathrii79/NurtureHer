from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import UserRole
from app.models.user import MotherProfile, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(db)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def asha_workers(self, district: str | None = None, limit: int = 20) -> list[User]:
        stmt = select(User).where(User.role == UserRole.ASHA_WORKER, User.is_active.is_(True), User.deleted_at.is_(None))
        if district:
            stmt = stmt.outerjoin(MotherProfile, MotherProfile.user_id == User.id).where(
                or_(MotherProfile.district == district, MotherProfile.district.is_(None))
            )
        result = await self.db.execute(stmt.order_by(User.created_at).limit(limit))
        return list(result.scalars().unique().all())
