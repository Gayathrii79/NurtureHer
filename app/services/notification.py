import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asha import Alert
from app.models.user import User
from app.repositories.alerts import AlertRepository

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def queue_sms_alert(self, user: User, message: str) -> Alert:
        """Persist an alert row and hand SMS dispatch to the Celery worker.

        The alert row is the source of truth for delivery state. Dispatch never raises:
        without phone number or broker the row records why no SMS went out, so the API
        reports the real state instead of failing the originating assessment.
        """
        repo = AlertRepository(self.db)
        if not user.phone:
            alert = await repo.create(user_id=user.id, message=message, sent_status="skipped_no_phone", sent_at=None)
            return alert

        alert = await repo.create(user_id=user.id, message=message, sent_status="queued", sent_at=None)

        # Import lazily so Celery can load tasks without cycling through
        # app.services -> notification -> app.workers.tasks.
        from app.workers.tasks import send_sms_alert

        try:
            send_sms_alert.delay(str(alert.id), user.phone, message)
        except Exception as exc:  # noqa: BLE001 - broker outages must not break the caller
            logger.warning("SMS dispatch queued but Celery broker unavailable (%s); alert %s kept as queued_no_worker", exc, alert.id)
            alert.sent_status = "queued_no_worker"
        return alert
