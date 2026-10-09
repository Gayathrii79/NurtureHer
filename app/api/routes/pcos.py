from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PaginationParams, pagination_params, require_roles
from app.core.database import get_db
from app.core.security import UserRole
from app.ml.model_loader import pcos_model_source
from app.models.user import User
from app.schemas.health import PCOSPredictRequest, PCOSPredictionRead
from app.services.health import PCOSService

router = APIRouter(prefix="/pcos", tags=["PCOS Prediction"])
mother_user = Depends(require_roles(UserRole.MOTHER, UserRole.ADMIN))


@router.post("/predict", response_model=PCOSPredictionRead)
async def predict(payload: PCOSPredictRequest, user: User = mother_user, db: AsyncSession = Depends(get_db)):
    prediction = await PCOSService(db).predict(user, payload)
    # Report the engine that actually produced this score (trained RF artifact vs rule fallback).
    return {**PCOSPredictionRead.model_validate(prediction).model_dump(), "model_source": pcos_model_source()}


@router.get("/model-info")
async def model_info(_: User = mother_user):
    """Truthful description of the live PCOS engine and its training provenance."""
    import json
    from pathlib import Path

    from app.core.config import settings

    source = pcos_model_source()
    meta_path = Path(settings.pcos_model_json_path).with_name("pcos_model_meta.json")
    meta: dict | None = None
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):  # pragma: no cover - unreadable artifact is non-fatal
            meta = None
    return {
        "model_source": source,
        "uses_random_forest": source.startswith("random_forest"),
        "metrics": (meta or {}).get("metrics"),
        "dataset": (meta or {}).get("dataset"),
        "dataset_citation": (meta or {}).get("citation"),
        "trained_at": (meta or {}).get("trained_at"),
        "samples": (meta or {}).get("samples"),
    }


@router.get("/history", response_model=list[PCOSPredictionRead])
async def history(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = mother_user,
    db: AsyncSession = Depends(get_db),
):
    return await PCOSService(db).history(user, pagination.limit, pagination.offset)
