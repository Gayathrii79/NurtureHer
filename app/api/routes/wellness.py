from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PaginationParams, get_current_user, pagination_params, require_roles
from app.core.database import get_db
from app.core.security import UserRole
from app.models.user import User
from app.analytics.dashboard import MotherAnalyticsService
from app.schemas.common import MessageResponse
from app.schemas.wellness import (
    DashboardStats,
    JournalCreate,
    JournalRead,
    JournalUpdate,
    MoodCreate,
    MoodRead,
    MoodUpdate,
    SymptomCreate,
    SymptomRead,
    SymptomUpdate,
    WellnessInsightsRead,
)
from app.services.wellness import WellnessService

router = APIRouter(prefix="/wellness", tags=["Mother Wellness"])
mother_user = Depends(require_roles(UserRole.MOTHER, UserRole.ADMIN))


@router.post("/mood", response_model=MoodRead)
async def create_mood(payload: MoodCreate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).create_mood(user, payload)


@router.get("/mood", response_model=list[MoodRead])
async def list_moods(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WellnessService(db).moods(user, pagination.limit, pagination.offset)


@router.get("/mood/{mood_id}", response_model=MoodRead)
async def get_mood(mood_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).get_mood(user, mood_id)


@router.patch("/mood/{mood_id}", response_model=MoodRead)
async def update_mood(mood_id: UUID, payload: MoodUpdate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).update_mood(user, mood_id, payload)


@router.delete("/mood/{mood_id}", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def delete_mood(mood_id: UUID, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    await WellnessService(db).delete_mood(user, mood_id)
    return MessageResponse(message="Mood entry deleted")


@router.post("/symptoms", response_model=SymptomRead)
async def create_symptoms(payload: SymptomCreate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).create_symptom(user, payload)


@router.get("/symptoms", response_model=list[SymptomRead])
async def list_symptoms(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WellnessService(db).symptoms(user, pagination.limit, pagination.offset)


@router.get("/symptoms/{symptom_id}", response_model=SymptomRead)
async def get_symptom(symptom_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).get_symptom(user, symptom_id)


@router.patch("/symptoms/{symptom_id}", response_model=SymptomRead)
async def update_symptom(symptom_id: UUID, payload: SymptomUpdate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).update_symptom(user, symptom_id, payload)


@router.delete("/symptoms/{symptom_id}", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def delete_symptom(symptom_id: UUID, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    await WellnessService(db).delete_symptom(user, symptom_id)
    return MessageResponse(message="Symptom entry deleted")


@router.post("/journal", response_model=JournalRead)
async def create_journal(payload: JournalCreate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).create_journal(user, payload)


@router.get("/journal", response_model=list[JournalRead])
async def list_journals(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await WellnessService(db).journals(user, pagination.limit, pagination.offset)


@router.get("/journal/{journal_id}", response_model=JournalRead)
async def get_journal(journal_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).get_journal(user, journal_id)


@router.patch("/journal/{journal_id}", response_model=JournalRead)
async def update_journal(journal_id: UUID, payload: JournalUpdate, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).update_journal(user, journal_id, payload)


@router.delete("/journal/{journal_id}", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def delete_journal(journal_id: UUID, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    await WellnessService(db).delete_journal(user, journal_id)
    return MessageResponse(message="Journal entry deleted")


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).dashboard(user)


@router.get("/analytics")
async def analytics(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await MotherAnalyticsService(db).dashboard(user)


@router.get("/insights", response_model=WellnessInsightsRead)
async def insights(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await WellnessService(db).insights(user)
