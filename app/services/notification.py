from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asha import Alert
from app.models.user import User
from app.repositories.alerts import AlertRepository
from app.workers.tasks import send_sms_alert


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def queue_sms_alert(self, user: User, message: str) -> Alert:
        alert = await AlertRepository(self.db).create(
            user_id=user.id,
            message=message,
            sent_status="queued" if user.phone else "skipped_no_phone",
            sent_at=None,
        )
        if user.phone:
            send_sms_alert.delay(str(alert.id), user.phone, message)
        return alert
