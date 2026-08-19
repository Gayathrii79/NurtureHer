from app.schemas.health import PCOSPredictRequest


def engineer_pcos_features(payload: PCOSPredictRequest) -> dict[str, float]:
    follicle_count = float(payload.follicle_count or 0)
    symptom_burden = sum(
        [
            payload.cycle_irregularity,
            payload.hair_growth,
            payload.skin_darkening,
            payload.weight_gain,
            payload.bmi >= 25,
            follicle_count >= 12,
        ]
    )
    return {
        "age": float(payload.age),
        "bmi": float(payload.bmi),
        "cycle_irregularity": 1.0 if payload.cycle_irregularity else 0.0,
        "hair_growth": 1.0 if payload.hair_growth else 0.0,
        "skin_darkening": 1.0 if payload.skin_darkening else 0.0,
        "weight_gain": 1.0 if payload.weight_gain else 0.0,
        "follicle_count": follicle_count,
        "symptom_burden": float(symptom_burden),
        "metabolic_signal": 1.0 if payload.bmi >= 30 or payload.skin_darkening else 0.0,
    }
