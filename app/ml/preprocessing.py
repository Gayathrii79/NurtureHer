from app.schemas.health import PCOSPredictRequest
from app.ml.pcos_feature_engineering import engineer_pcos_features
from app.ml.features import FEATURE_ORDER

__all__ = ["FEATURE_ORDER", "preprocess_pcos_features"]


def preprocess_pcos_features(payload: PCOSPredictRequest) -> list[float]:
    values = engineer_pcos_features(payload)
    return [
        float(values["age"]),
        float(values["bmi"]),
        values["cycle_irregularity"],
        values["hair_growth"],
        values["skin_darkening"],
        values["weight_gain"],
        float(values["follicle_count"] or 0),
    ]
