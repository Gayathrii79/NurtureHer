import pytest

from app.schemas.health import PCOSPredictRequest, PPDAssessmentRequest


@pytest.fixture
def high_pcos_payload() -> PCOSPredictRequest:
    return PCOSPredictRequest(
        age=29,
        bmi=34,
        cycle_irregularity=True,
        hair_growth=True,
        skin_darkening=True,
        weight_gain=True,
        follicle_count=28,
    )


@pytest.fixture
def moderate_ppd_payload() -> PPDAssessmentRequest:
    # EPDS = 10 (moderate follow-up band) with item 10 (self-harm) left at 0 so the
    # case is genuinely moderate rather than escalated to HIGH by an item-10 endorsement.
    return PPDAssessmentRequest(answers=[1, 1, 1, 1, 1, 1, 1, 1, 2, 0], journal_text="I feel tired and alone")

