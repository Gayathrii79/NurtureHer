import json
import logging
import pickle
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from app.core.config import settings
from app.ml.portable_forest import PortableRandomForest

logger = logging.getLogger(__name__)


class ProbabilityModel(Protocol):
    def predict_proba(self, values: list[list[float]]) -> list[list[float]]:
        ...


class RuleBasedPCOSFallback:
    """Heuristic scorer used only when no trained artifact is available."""

    def predict_proba(self, values: list[list[float]]) -> list[list[float]]:
        features = values[0]
        age, bmi, cycle_irregularity, hair_growth, skin_darkening, weight_gain, follicle_count = features
        probability = 0.05
        probability += 0.25 if cycle_irregularity else 0
        probability += 0.15 if bmi >= 30 else 0.07 if bmi >= 25 else 0
        probability += 0.12 if hair_growth else 0
        probability += 0.10 if skin_darkening else 0
        probability += 0.10 if weight_gain else 0
        probability += min(follicle_count / 100, 0.2)
        # PCOS prevalence peaks during the primary reproductive years (18-35).
        probability += 0.03 if 18 <= age <= 35 else 0.0
        probability = round(min(probability, 0.98), 4)
        return [[1 - probability, probability]]


def _load_pickle_model(path: Path) -> ProbabilityModel | None:
    try:
        with path.open("rb") as model_file:
            model = pickle.load(model_file)
        logger.info("Loaded trained PCOS RandomForest (pickle) from %s", path)
        return model
    except Exception as exc:  # noqa: BLE001 - version-mismatched pickles raise many types
        logger.warning("Failed to load PCOS pickle at %s (%s); trying portable JSON artifact", path, exc)
        return None


def _load_json_model(path: Path) -> ProbabilityModel | None:
    try:
        model = PortableRandomForest.load(path)
        logger.info("Loaded trained PCOS RandomForest (portable JSON) from %s", path)
        return model
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load portable PCOS model at %s (%s)", path, exc)
        return None


@lru_cache
def load_pcos_model() -> ProbabilityModel:
    pickle_path = Path(settings.pcos_model_path)
    if pickle_path.exists():
        model = _load_pickle_model(pickle_path)
        if model is not None:
            return model

    json_path = Path(settings.pcos_model_json_path)
    if json_path.exists():
        model = _load_json_model(json_path)
        if model is not None:
            return model

    logger.warning(
        "No trained PCOS model found (%s / %s); using rule-based fallback. "
        "Run `python -m scripts.fetch_pcos_dataset` then "
        "`python -m app.ml.train_pcos --input data/pcos/pcos_data_without_infertility.csv`.",
        pickle_path,
        json_path,
    )
    return RuleBasedPCOSFallback()


def pcos_model_source() -> str:
    """Identify the live engine: random_forest_pickle | random_forest_json | rule_fallback."""
    model = load_pcos_model()
    if isinstance(model, RuleBasedPCOSFallback):
        return "rule_fallback"
    if isinstance(model, PortableRandomForest):
        return "random_forest_json"
    return "random_forest_pickle"
