from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import HIGH_RISK_PCOS_THRESHOLD, HIGH_RISK_PPD_LEVELS
from app.models.enums import RiskLevel
from app.models.user import MotherProfile, User
from app.repositories.health import HighRiskRepository
from app.repositories.users import UserRepository
from app.services.notification import NotificationService


class HighRiskEngine:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.notifications = NotificationService(db)

    async def evaluate(self, user: User, risk_type: str, risk_level: RiskLevel) -> bool:
        should_create = (
            (risk_type == "pcos" and risk_level == HIGH_RISK_PCOS_THRESHOLD)
            or (risk_type == "ppd" and risk_level in HIGH_RISK_PPD_LEVELS)
        )
        if not should_create:
            return False

        mother_profile = await self.db.scalar(select(MotherProfile).where(MotherProfile.user_id == user.id))
        district = mother_profile.district if mother_profile else None
        asha_workers = await UserRepository(self.db).asha_workers(district=district, limit=1)
        assigned_worker = asha_workers[0] if asha_workers else None
        await HighRiskRepository(self.db).create(
            user_id=user.id,
            risk_type=risk_type,
            risk_level=risk_level,
            assigned_worker_id=assigned_worker.id if assigned_worker else None,
        )
        message = f"NurtureHer alert: {user.name} has {risk_level.value} {risk_type.upper()} risk. Please review."
        await self.notifications.queue_sms_alert(assigned_worker or user, message)
        return True
