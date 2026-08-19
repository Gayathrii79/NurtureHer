from app.models.enums import RiskLevel
from app.schemas.health import PCOSPredictRequest


class PCOSRecommendationEngine:
    def generate(self, payload: PCOSPredictRequest, risk: RiskLevel, probability: float) -> str:
        recommendations = [
            f"Estimated PCOS risk probability: {probability:.0%}.",
            "Track cycle dates, bleeding pattern, acne or hair growth changes, weight changes, and energy levels.",
        ]
        if risk == RiskLevel.HIGH:
            recommendations.append("High risk detected. Please consult a gynecologist for evaluation and hormonal/metabolic testing.")
        elif risk == RiskLevel.MODERATE:
            recommendations.append("Moderate risk detected. Consider a clinical review if irregular cycles or symptoms persist.")
        else:
            recommendations.append("Current screening suggests low risk. Continue preventive checkups and routine wellness tracking.")

        if payload.bmi >= 25:
            recommendations.append("Discuss nutrition, movement, and metabolic screening with a healthcare professional.")
        if payload.cycle_irregularity:
            recommendations.append("Cycle irregularity is an important signal; keep a period log for at least three cycles.")
        if payload.hair_growth or payload.skin_darkening:
            recommendations.append("Skin or hair-growth changes can be useful clinical clues; mention them during consultation.")
        return " ".join(recommendations)
