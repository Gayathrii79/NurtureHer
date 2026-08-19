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
    return PPDAssessmentRequest(answers=[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], journal_text="I feel tired and alone")

