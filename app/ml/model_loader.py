import logging
import pickle
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.core.config import settings

logger = logging.getLogger(__name__)


class ProbabilityModel(Protocol):
    def predict_proba(self, values: list[list[float]]) -> list[list[float]]:
        ...


class RuleBasedPCOSFallback:
    def predict_proba(self, values: list[list[float]]) -> list[list[float]]:
        features = values[0]
        _, bmi, cycle_irregularity, hair_growth, skin_darkening, weight_gain, follicle_count = features
        probability = 0.05
        probability += 0.25 if cycle_irregularity else 0
        probability += 0.15 if bmi >= 30 else 0.07 if bmi >= 25 else 0
        probability += 0.12 if hair_growth else 0
        probability += 0.10 if skin_darkening else 0
        probability += 0.10 if weight_gain else 0
        probability += min(follicle_count / 100, 0.2)
        probability = round(min(probability, 0.98), 4)
        return [[1 - probability, probability]]


@lru_cache
def load_pcos_model() -> ProbabilityModel:
    path = Path(settings.pcos_model_path)
    if path.exists():
        with path.open("rb") as model_file:
            logger.info("Loading PCOS model from %s", path)
            return pickle.load(model_file)

    logger.warning("PCOS model not found at %s; using calibrated rule-based fallback", path)
    return RuleBasedPCOSFallback()

