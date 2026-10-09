"""End-to-end API tests: authentication, role-based authorization, data ownership (IDOR),
real PDF export, truthful alert dispatch, and ML engine honesty.

Every test runs against a throw-away SQLite database (FastAPI dependency override) so no
test ever writes to the development database.
"""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.workers.tasks as worker_tasks
from app.core.database import Base, get_db
from app.core.security import UserRole, create_access_token, hash_password
from app.main import app
from app.models.user import MotherProfile, User


@pytest.fixture()
def client(tmp_path):
    """TestClient bound to an isolated SQLite database with seeded users of every role."""
    db_path = tmp_path / "test.db"
    sync_engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=sync_engine)
    session_factory = sessionmaker(bind=sync_engine, expire_on_commit=False)

    seeded: dict[str, User] = {}
    with session_factory() as session:
        for key, name, email, role, phone in [
            ("mother_a", "Mother Alpha", "mother.a@example.com", UserRole.MOTHER, "+911111111111"),
            ("mother_b", "Mother Bravo", "mother.b@example.com", UserRole.MOTHER, None),
            ("asha", "ASHA Worker One", "asha.one@example.com", UserRole.ASHA_WORKER, "+912222222222"),
            ("caregiver", "Caregiver Kin", "caregiver.k@example.com", UserRole.CAREGIVER, None),
            ("admin", "Admin Person", "admin.p@example.com", UserRole.ADMIN, None),
        ]:
            user = User(
                id=uuid.uuid4(),
                name=name,
                email=email,
                phone=phone,
                password_hash=hash_password("Password123!"),
                role=role,
                preferred_language="en",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            if role == UserRole.MOTHER:
                session.add(
                    MotherProfile(
                        user_id=user.id,
                        district="Bengaluru Urban" if key == "mother_a" else None,
                        village="Yelahanka" if key == "mother_a" else None,
                        blood_group="O+" if key == "mother_a" else None,
                    )
                )
            seeded[key] = user
        session.commit()
    ids = {key: user.id for key, user in seeded.items()}

    async def override_get_db():
        from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

        engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
        factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        async with factory() as session:
            yield session
        await engine.dispose()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            test_client.user_ids = ids  # type: ignore[attr-defined]
            yield test_client
    finally:
        app.dependency_overrides.clear()
        sync_engine.dispose()


@pytest.fixture(autouse=True)
def no_broker(monkeypatch):
    """Simulate an unreachable Celery/Redis broker by default.

    Alert rows must still be persisted with a truthful status instead of the API failing or
    claiming delivery. Tests that assert real dispatch re-patch ``delay`` themselves.
    """

    def unavailable(*args, **kwargs):
        raise RuntimeError("broker unavailable")

    monkeypatch.setattr(worker_tasks.send_sms_alert, "delay", unavailable)


def auth(user_id) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_register_login_me_flow(client):
    email = f"new.user.{uuid.uuid4().hex[:8]}@example.com"
    created = client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": "New Mother", "password": "Password123!", "role": "mother"},
    )
    assert created.status_code == 201, created.text

    login = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_refresh_survives_redis_outage_and_stays_single_use(client, monkeypatch):
    """Access tokens expire after 30 minutes; refresh must keep the session alive even when
    Redis is unreachable (the refresh_tokens DB row is authoritative), and a rotated refresh
    token must still be rejected on replay.
    """
    from app.core import redis as redis_module

    async def redis_miss(*args, **kwargs):
        return None

    async def redis_delete_miss(*args, **kwargs):
        return 0

    monkeypatch.setattr(redis_module.redis_client, "get", redis_miss)
    monkeypatch.setattr(redis_module.redis_client, "setex", redis_miss)
    monkeypatch.setattr(redis_module.redis_client, "delete", redis_delete_miss)

    login = client.post(
        "/api/v1/auth/login", json={"email": "mother.a@example.com", "password": "Password123!"}
    )
    assert login.status_code == 200, login.text
    first_refresh = login.json()["refresh_token"]

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert refreshed.status_code == 200, refreshed.text
    pair = refreshed.json()
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {pair['access_token']}"})
    assert me.status_code == 200

    # Rotation is single-use: replaying the old refresh token must be rejected.
    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": first_refresh})
    assert replay.status_code == 401, replay.text

    # The rotated successor keeps working without Redis as well.
    again = client.post("/api/v1/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    assert again.status_code == 200, again.text


def test_mother_cannot_access_asha_queue(client):
    response = client.get("/api/v1/asha/high-risk", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 403


def test_mother_cannot_send_asha_alert(client):
    response = client.post(
        "/api/v1/asha/send-alert",
        json={"user_id": str(client.user_ids["mother_b"]), "message": "hello"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert response.status_code == 403


def test_caregiver_cannot_access_admin_dashboard(client):
    response = client.get("/api/v1/admin/dashboard", headers=auth(client.user_ids["caregiver"]))
    assert response.status_code == 403


def test_mother_cannot_access_admin_users(client):
    response = client.get("/api/v1/admin/users", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 403


def test_asha_queue_shows_mother_identity_not_uuid_only(client):
    # Create a real high-risk PCOS assessment as mother A (also exercises the ML path).
    prediction = client.post(
        "/api/v1/pcos/predict",
        json={
            "age": 29,
            "bmi": 34,
            "cycle_irregularity": True,
            "hair_growth": True,
            "skin_darkening": True,
            "weight_gain": True,
            "follicle_count": 28,
        },
        headers=auth(client.user_ids["mother_a"]),
    )
    assert prediction.status_code == 200, prediction.text

    queue = client.get("/api/v1/asha/high-risk", headers=auth(client.user_ids["asha"]))
    assert queue.status_code == 200, queue.text
    cases = queue.json()
    assert cases, "a high-risk PCOS case must be visible to the ASHA worker"
    case = next(c for c in cases if c["user_id"] == str(client.user_ids["mother_a"]))
    assert case["mother_name"] == "Mother Alpha"
    assert case["district"] == "Bengaluru Urban"
    assert case["mother_phone"] == "+911111111111"


def test_profile_is_scoped_to_caller(client):
    updated = client.put(
        "/api/v1/wellness/profile",
        json={"age": 31, "village": "Indira Nagar"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert updated.status_code == 200, updated.text

    a_view = client.get("/api/v1/wellness/profile", headers=auth(client.user_ids["mother_a"]))
    b_view = client.get("/api/v1/wellness/profile", headers=auth(client.user_ids["mother_b"]))
    assert a_view.status_code == 200 and b_view.status_code == 200
    assert a_view.json()["age"] == 31
    assert a_view.json()["village"] == "Indira Nagar"
    # Mother B must never see mother A's data.
    assert b_view.json()["age"] is None
    assert b_view.json()["village"] is None
    assert b_view.json()["user_id"] == str(client.user_ids["mother_b"])


def test_patch_me_updates_own_account(client):
    response = client.patch(
        "/api/v1/auth/me",
        json={"name": "Mother Alpha Renamed", "preferred_language": "hi"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert response.status_code == 200, response.text
    assert response.json()["name"] == "Mother Alpha Renamed"
    assert response.json()["preferred_language"] == "hi"

    untouched = client.get("/api/v1/auth/me", headers=auth(client.user_ids["mother_b"]))
    assert untouched.json()["name"] == "Mother Bravo"


def test_pdf_report_is_real_and_contains_only_own_data(client):
    # Some data for mother A, none for mother B.
    client.post("/api/v1/wellness/mood", json={"mood": "happy", "note": "alpha note"}, headers=auth(client.user_ids["mother_a"]))

    response = client.get("/api/v1/wellness/report/pdf", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "nurtureher-health-report-" in response.headers["content-disposition"]
    body = response.content
    assert body[:5] == b"%PDF-"
    assert len(body) > 1500
    assert b"Mother Alpha" in body
    assert b"mother.a@example.com" in body
    assert b"Mother Bravo" not in body
    assert b"mother.b@example.com" not in body

    # Another authenticated user gets their own report, not mother A's.
    other = client.get("/api/v1/wellness/report/pdf", headers=auth(client.user_ids["mother_b"]))
    assert other.status_code == 200
    assert b"Mother Alpha" not in other.content
    assert b"Mother Bravo" in other.content


def test_emergency_sos_records_alert_with_truthful_status(client, monkeypatch):
    # Simulate the background worker being unreachable: the API must not claim an SMS was sent.
    def boom(*args, **kwargs):
        raise RuntimeError("broker down")

    monkeypatch.setattr(worker_tasks.send_sms_alert, "delay", boom)

    response = client.post("/api/v1/wellness/emergency-sos", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["alerts"], "an alert record must be created"
    statuses = {item["sent_status"] for item in payload["alerts"]}
    assert "sent" not in statuses
    self_status = next(item for item in payload["alerts"] if item["recipient"] == "self")
    # mother A has a phone and the worker is down -> queued_no_worker, never "sent"
    assert self_status["sent_status"] in {"queued", "queued_no_worker"}
    if self_status["sent_status"] == "queued_no_worker":
        assert "not been sent" in payload["message"] or "not running" in payload["message"]

    # A user with no phone number gets an explicit skipped state instead of a fake success.
    no_phone = client.post("/api/v1/wellness/emergency-sos", headers=auth(client.user_ids["mother_b"]))
    assert no_phone.status_code == 200
    self_b = next(item for item in no_phone.json()["alerts"] if item["recipient"] == "self")
    assert self_b["sent_status"] == "skipped_no_phone"


def test_emergency_sos_notifies_assigned_asha_worker(client, monkeypatch):
    dispatched: list[tuple] = []

    def capture(alert_id, phone, message):
        dispatched.append((alert_id, phone, message))
        return True

    monkeypatch.setattr(worker_tasks.send_sms_alert, "delay", capture)

    response = client.post("/api/v1/wellness/emergency-sos", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 200
    recipients = {item["recipient"] for item in response.json()["alerts"]}
    assert "self" in recipients and "asha_worker" in recipients
    assert dispatched, "the SMS worker must be handed the alert when the broker is up"


def test_notifications_are_scoped_to_caller(client):
    client.post("/api/v1/wellness/emergency-sos", headers=auth(client.user_ids["mother_a"]))
    client.post("/api/v1/wellness/emergency-sos", headers=auth(client.user_ids["mother_b"]))

    own = client.get("/api/v1/notifications", headers=auth(client.user_ids["mother_a"]))
    assert own.status_code == 200
    own_ids = {item["user_id"] for item in own.json()}
    assert own_ids, "mother A triggered an SOS, so she must have alerts"
    assert own_ids == {str(client.user_ids["mother_a"])}

    other = client.get("/api/v1/notifications", headers=auth(client.user_ids["mother_b"]))
    assert other.status_code == 200
    other_ids = {item["user_id"] for item in other.json()}
    assert other_ids == {str(client.user_ids["mother_b"])}
    assert not own_ids & other_ids, "no alert may leak between users"


def test_pcos_model_info_reports_actual_engine(client):
    response = client.get("/api/v1/pcos/model-info", headers=auth(client.user_ids["mother_a"]))
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["model_source"] in {"random_forest_pickle", "random_forest_json", "rule_fallback"}
    if payload["model_source"].startswith("random_forest"):
        assert payload["uses_random_forest"] is True
        assert payload["metrics"] and "roc_auc" in payload["metrics"]
        assert payload["dataset_citation"]


def test_pcos_predict_reports_engine_used(client):
    response = client.post(
        "/api/v1/pcos/predict",
        json={"age": 24, "bmi": 22, "cycle_irregularity": False, "follicle_count": 6},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert response.status_code == 200, response.text
    assert response.json()["model_source"] in {"random_forest_pickle", "random_forest_json", "rule_fallback"}


def test_ppd_tiers_end_to_end(client):
    low = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], "journal_text": "I feel calm and happy"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert low.status_code == 200, low.text
    assert low.json()["risk_level"] == "low"
    assert low.json()["epds_score"] == 0

    moderate = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [1, 1, 1, 1, 1, 1, 1, 1, 2, 0], "journal_text": "tired and a bit alone"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert moderate.status_code == 200, moderate.text
    assert moderate.json()["epds_score"] == 10
    assert moderate.json()["risk_level"] == "moderate"

    high = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [3, 3, 3, 3, 3, 3, 3, 3, 3, 0], "journal_text": "hopeless and crying"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert high.status_code == 200, high.text
    assert high.json()["epds_score"] == 27
    assert high.json()["risk_level"] == "high"
    assert high.json()["recommendations"]

    # Item-10 endorsement always escalates regardless of total score.
    item10 = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [0, 0, 0, 0, 0, 0, 0, 0, 0, 1], "journal_text": None},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert item10.status_code == 200
    assert item10.json()["risk_level"] == "high"

    # Incomplete input is rejected by validation, not silently accepted.
    invalid = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [1, 2, 3], "journal_text": None},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert invalid.status_code == 422

    history = client.get("/api/v1/ppd/history", headers=auth(client.user_ids["mother_a"]))
    assert history.status_code == 200
    assert len(history.json()) >= 4  # repeated assessments persist


def test_high_risk_assessment_creates_asha_case_and_alert(client, monkeypatch):
    def capture(*args, **kwargs):
        return True

    monkeypatch.setattr(worker_tasks.send_sms_alert, "delay", capture)

    response = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], "journal_text": "hopeless"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert response.status_code == 200

    queue = client.get("/api/v1/asha/high-risk?risk_type=ppd", headers=auth(client.user_ids["asha"]))
    assert queue.status_code == 200
    assert any(case["user_id"] == str(client.user_ids["mother_a"]) for case in queue.json())

    alerts = client.get("/api/v1/asha/alerts", headers=auth(client.user_ids["asha"]))
    assert alerts.status_code == 200
    assert alerts.json(), "a high-risk assessment must raise an alert for the ASHA worker"


def test_wellness_analytics_reflect_persisted_data(client):
    for mood in ["happy", "tired", "happy"]:
        client.post("/api/v1/wellness/mood", json={"mood": mood, "note": "tracked"}, headers=auth(client.user_ids["mother_a"]))
    client.post(
        "/api/v1/wellness/symptoms",
        json={"fatigue": True, "headache": False, "sleep_issue": True, "anxiety": False, "cramps": False},
        headers=auth(client.user_ids["mother_a"]),
    )

    analytics = client.get("/api/v1/wellness/analytics", headers=auth(client.user_ids["mother_a"]))
    assert analytics.status_code == 200, analytics.text
    payload = analytics.json()
    assert payload["mood_trends"].get("happy") == 2
    assert payload["mood_trends"].get("tired") == 1
    assert payload["symptom_trends"]["fatigue"] >= 1
    assert payload["symptom_trends"]["sleep_issue"] >= 1

    # Another mother's analytics must be empty - no cross-user aggregation.
    other = client.get("/api/v1/wellness/analytics", headers=auth(client.user_ids["mother_b"]))
    assert other.status_code == 200
    assert other.json()["mood_trends"] == {}


def test_asha_can_update_case_status(client):
    # Create a high-risk case in this test's isolated database first (EPDS 30 is always HIGH).
    created = client.post(
        "/api/v1/ppd/assessment",
        json={"answers": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], "journal_text": "hopeless and alone"},
        headers=auth(client.user_ids["mother_a"]),
    )
    assert created.status_code == 200, created.text

    case_list = client.get("/api/v1/asha/high-risk", headers=auth(client.user_ids["asha"]))
    assert case_list.status_code == 200
    assert case_list.json(), "the assessment must appear in the ASHA queue"
    case_id = case_list.json()[0]["id"]
    updated = client.patch(
        f"/api/v1/asha/high-risk/{case_id}",
        json={"status": "resolved"},
        headers=auth(client.user_ids["asha"]),
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "resolved"


def test_admin_dashboard_reports_real_model_state(client):
    response = client.get("/api/v1/admin/dashboard", headers=auth(client.user_ids["admin"]))
    assert response.status_code == 200, response.text
    models = response.json()["models"]
    assert models["pcos"]["engine"] in {"random_forest_pickle", "random_forest_json", "rule_fallback"}
    assert models["ppd"]["scoring"].startswith("EPDS")
    assert models["ppd"]["sentiment_engine"] in {"transformer", "lexicon"}
    assert models["sms"]["provider"]


def test_emergency_sos_requires_authentication(client):
    response = client.post("/api/v1/wellness/emergency-sos")
    assert response.status_code == 401


def test_pdf_report_requires_authentication(client):
    response = client.get("/api/v1/wellness/report/pdf")
    assert response.status_code == 401


def test_carecircle_qr_consent_flow_with_sqlite_naive_datetimes(client):
    """Regression: a QR expiry read back from SQLite is naive, so comparing it to an
    aware ``now(utc)`` raised TypeError and returned 500 on ``request-access``. The full
    request -> approve -> consent-filtered shared-summary flow must work end to end.
    """
    mother = client.user_ids["mother_a"]
    caregiver = client.user_ids["caregiver"]

    qr = client.get("/api/v1/carecircle/qr", headers=auth(mother))
    assert qr.status_code == 200, qr.text
    token = qr.json()["token"]

    requested = client.post(
        "/api/v1/carecircle/request-access",
        json={"token": token, "relationship_label": "Spouse"},
        headers=auth(caregiver),
    )
    assert requested.status_code == 200, requested.text
    assert requested.json()["status"] == "pending"

    pending = client.get("/api/v1/carecircle/requests", headers=auth(mother))
    assert pending.status_code == 200, pending.text
    access_id = next(r["id"] for r in pending.json() if r["status"] == "pending")

    approved = client.post(
        f"/api/v1/carecircle/requests/{access_id}/respond",
        json={"action": "approve"},
        headers=auth(mother),
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"

    connections = client.get("/api/v1/carecircle/connections", headers=auth(caregiver))
    assert connections.status_code == 200, connections.text
    assert any(c["access_id"] == access_id for c in connections.json())

    summary = client.get(f"/api/v1/carecircle/shared-summary/{access_id}", headers=auth(caregiver))
    assert summary.status_code == 200, summary.text
    assert summary.json()["mother_name"] == "Mother Alpha"


def test_carecircle_rejects_self_and_stale_tokens(client):
    mother = client.user_ids["mother_a"]
    qr = client.get("/api/v1/carecircle/qr", headers=auth(mother))
    assert qr.status_code == 200, qr.text
    token = qr.json()["token"]

    # A mother cannot request access to her own profile.
    own = client.post(
        "/api/v1/carecircle/request-access",
        json={"token": token},
        headers=auth(mother),
    )
    assert own.status_code == 400

    # An unknown/garbage token is a clean 404, never a 500.
    missing = client.post(
        "/api/v1/carecircle/request-access",
        json={"token": "not-a-real-token"},
        headers=auth(client.user_ids["caregiver"]),
    )
    assert missing.status_code == 404
