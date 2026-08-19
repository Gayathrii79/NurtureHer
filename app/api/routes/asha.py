from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PaginationParams, pagination_params, require_roles
from app.analytics.dashboard import ASHAAnalyticsService
from app.core.database import get_db
from app.core.security import UserRole
from app.models.enums import CaseStatus, RiskLevel
from app.models.user import User
from app.repositories.health import AlertRepository
from app.repositories.users import UserRepository
from app.schemas.common import MessageResponse
from app.schemas.health import AlertRead, AlertRequest, AlertUpdate, HighRiskCaseRead, HighRiskCaseUpdate
from app.services.alert_service import AlertService
from app.services.health import AshaService

router = APIRouter(prefix="/asha", tags=["ASHA/ANM Dashboard"])
asha_user = Depends(require_roles(UserRole.ASHA_WORKER, UserRole.ADMIN))


@router.get("/high-risk", response_model=list[HighRiskCaseRead])
async def high_risk(
    pagination: PaginationParams = Depends(pagination_params),
    risk_level: RiskLevel | None = Query(default=None),
    status: CaseStatus | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=120),
    district: str | None = Query(default=None, min_length=1, max_length=120),
    village: str | None = Query(default=None, min_length=1, max_length=120),
    risk_type: str | None = Query(default=None, min_length=1, max_length=40),
    assigned_worker_id: UUID | None = Query(default=None),
    _: User = asha_user,
    db: AsyncSession = Depends(get_db),
):
    return await AshaService(db).high_risk_cases(
        risk_level,
        status,
        search,
        district,
        village,
        risk_type,
        assigned_worker_id,
        pagination.limit,
        pagination.offset,
    )


@router.patch("/high-risk/{case_id}", response_model=HighRiskCaseRead)
async def update_high_risk_case(case_id: UUID, payload: HighRiskCaseUpdate, _: User = asha_user, db: AsyncSession = Depends(get_db)):
    return await AshaService(db).update_high_risk_case(case_id, payload)


@router.get("/statistics")
async def statistics(_: User = asha_user, db: AsyncSession = Depends(get_db)):
    stats = await AshaService(db).statistics()
    analytics = await ASHAAnalyticsService(db).dashboard()
    return {**stats, **analytics}


@router.post("/send-alert", response_model=AlertRead)
async def send_alert(payload: AlertRequest, _: User = asha_user, db: AsyncSession = Depends(get_db)):
    mother = await UserRepository(db).get(payload.user_id)
    if mother:
        return await AlertService(db).send_manual_alert(mother, payload.message)
    alert = await AlertRepository(db).create(user_id=payload.user_id, message=payload.message, sent_status="failed_user_not_found")
    await db.commit()
    return alert


@router.get("/alerts", response_model=list[AlertRead])
async def list_alerts(
    pagination: PaginationParams = Depends(pagination_params),
    sent_status: str | None = Query(default=None, max_length=40),
    _: User = asha_user,
    db: AsyncSession = Depends(get_db),
):
    return await AlertRepository(db).all_alerts(sent_status, pagination.limit, pagination.offset)


@router.patch("/alerts/{alert_id}", response_model=AlertRead)
async def update_alert(alert_id: UUID, payload: AlertUpdate, _: User = asha_user, db: AsyncSession = Depends(get_db)):
    from app.core.exceptions import AppError
    from fastapi import status as http_status

    repo = AlertRepository(db)
    alert = await repo.get(alert_id)
    if not alert:
        raise AppError("Alert not found", http_status.HTTP_404_NOT_FOUND)
    alert = await repo.update(alert, sent_status=payload.sent_status)
    await db.commit()
    return alert


@router.get("/health", response_model=MessageResponse)
async def health(_: User = asha_user):
    return MessageResponse(message="ASHA dashboard is available.")
