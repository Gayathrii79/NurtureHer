from app.ml.sentiment import analyze_sentiment, analyze_sentiment_detailed
from app.ml.ppd_recommendations import PPDRecommendationEngine
from app.models.enums import RiskLevel
from app.schemas.health import PPDAssessmentRequest
from app.services.scoring_engine import EPDScoringEngine


class PPDRiskDetectionService:
    def __init__(self) -> None:
        self.scoring_engine = EPDScoringEngine()
        self.recommendations = PPDRecommendationEngine()

    def assess(
        self, payload: PPDAssessmentRequest, journal_sentiment_prob: float | None = None
    ) -> tuple[int, str, float, float, RiskLevel, str]:
        """Perform a full PPD assessment, returning (epds_score, sentiment, sentiment_score, combined_risk_score, risk, recommendations)."""
        score = self.scoring_engine.score(payload.answers)
        sentiment_result = analyze_sentiment_detailed(payload.journal_text)
        sentiment_label = sentiment_result.label
        negative_prob = sentiment_result.negative_prob

        # Blend recent journal sentiment trend if provided
        if journal_sentiment_prob is not None:
            negative_prob = round((negative_prob + journal_sentiment_prob) / 2, 3)

        combined_risk_score = self.scoring_engine.dual_signal_score(score, negative_prob)
        risk = self.scoring_engine.classify(score, payload.answers, combined_risk_score)
        recommendations = self.recommendations.generate(score, sentiment_label, risk)
        return score, sentiment_label, negative_prob, combined_risk_score, risk, recommendations
