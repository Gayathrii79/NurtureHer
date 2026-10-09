"""Clinically validated scoring for the Edinburgh Postnatal Depression Scale (EPDS).

References:
    Cox, J. L., Holden, J. M., & Sagovsky, R. (1987). Detection of postnatal depression:
    Development of the 10-item Edinburgh Postnatal Depression Scale. *British Journal of
    Psychiatry*, 150(6), 782-786.

Scoring contract
----------------
Every answer passed to :meth:`EPDScoringEngine.score` is the **item score** (0-3) that the
user selected, i.e. the value rendered next to each option in the questionnaire UI:

* Items 1, 2, 4 (positively worded) are presented healthy-first:
  ``0 = As much as I always could`` ... ``3 = Not at all``.
* Items 3, 5-10 (negatively worded) are presented distressed-first:
  ``3 = Yes, most of the time`` ... ``0 = No, never``.

Because the UI already assigns the published score to each option, the total is the plain
sum of the ten answers. This preserves the instrument's own semantics: a respondent who
picks the healthiest option on every item scores 0/30, and one who picks the most distressed
option on every item scores 30/30.

Risk tiers:
    HIGH      EPDS >= 13, or any endorsement of item 10 (self-harm ideation).
    MODERATE  EPDS 10-12 (the clinical "further assessment" band), or a strongly negative
              dual-signal score (EPDS + journal sentiment >= 0.45).
    LOW       everything else.
"""

from app.models.enums import RiskLevel

# Items worded positively: their options run healthy (0) -> distressed (3) in the UI.
POSITIVELY_WORDED_ITEMS = {1, 2, 4}

EPDS_TOTAL_ITEMS = 10
EPDS_MAX_SCORE = 30
HIGH_RISK_EPDS_CUTOFF = 13
MODERATE_RISK_EPDS_CUTOFF = 10
MODERATE_RISK_COMBINED_CUTOFF = 0.45


class EPDScoringEngine:
    """Computes the validated Edinburgh Postnatal Depression Scale (EPDS) score."""

    def score(self, answers: list[int]) -> int:
        """Return the total EPDS score (0-30) from ten 0-3 item scores."""
        if len(answers) != EPDS_TOTAL_ITEMS:
            raise ValueError("EPDS requires exactly 10 answers")
        if any(answer < 0 or answer > 3 for answer in answers):
            raise ValueError("EPDS answers must be between 0 and 3")
        return sum(answers)

    def dual_signal_score(self, epds_score: int, negative_prob: float) -> float:
        """Combine EPDS (0-30) and sentiment negative_prob (0-1) into a unified risk score (0-1).

        Weights: 70% EPDS, 30% sentiment.
        """
        epds_normalized = epds_score / EPDS_MAX_SCORE
        combined = 0.7 * epds_normalized + 0.3 * negative_prob
        return round(min(max(combined, 0.0), 1.0), 4)

    def classify(self, epds_score: int, answers: list[int], combined_risk_score: float) -> RiskLevel:
        """Classify PPD risk tier given the EPDS score, raw answers, and combined dual-signal score.

        Rules:
            - EPDS >= 13 -> HIGH
            - Item 10 (self-harm thoughts) > 0 -> HIGH
            - EPDS >= 10 (clinical follow-up band) -> MODERATE
            - Combined dual-signal >= 0.45 -> MODERATE
            - Otherwise -> LOW
        """
        if epds_score >= HIGH_RISK_EPDS_CUTOFF:
            return RiskLevel.HIGH
        if len(answers) == EPDS_TOTAL_ITEMS and answers[9] > 0:  # item 10 = index 9
            return RiskLevel.HIGH
        if epds_score >= MODERATE_RISK_EPDS_CUTOFF:
            return RiskLevel.MODERATE
        if combined_risk_score >= MODERATE_RISK_COMBINED_CUTOFF:
            return RiskLevel.MODERATE
        return RiskLevel.LOW
