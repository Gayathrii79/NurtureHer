import uuid
import pytest
import requests

LIVE_API = "http://localhost:8000/api/v1"


def test_mood_and_journal_live_api_and_user_isolation():
    # 1. Register User A
    user_a_email = f"mother_a_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123!"
    r_reg_a = requests.post(
        f"{LIVE_API}/auth/register",
        json={"email": user_a_email, "name": "Mother A", "password": pwd, "role": "mother", "preferred_language": "en"},
    )
    assert r_reg_a.status_code == 201
    r_login_a = requests.post(f"{LIVE_API}/auth/login", json={"email": user_a_email, "password": pwd})
    assert r_login_a.status_code == 200
    token_a = r_login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register User B
    user_b_email = f"mother_b_{uuid.uuid4().hex[:8]}@example.com"
    r_reg_b = requests.post(
        f"{LIVE_API}/auth/register",
        json={"email": user_b_email, "name": "Mother B", "password": pwd, "role": "mother", "preferred_language": "en"},
    )
    assert r_reg_b.status_code == 201
    r_login_b = requests.post(f"{LIVE_API}/auth/login", json={"email": user_b_email, "password": pwd})
    assert r_login_b.status_code == 200
    token_b = r_login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A creates mood and journal
    r_mood_a = requests.post(
        f"{LIVE_API}/wellness/mood",
        headers=headers_a,
        json={"mood": "happy", "note": "Feeling energetic today!"},
    )
    assert r_mood_a.status_code == 200
    assert r_mood_a.json()["mood"] == "happy"
    assert r_mood_a.json()["note"] == "Feeling energetic today!"

    r_journal_a = requests.post(
        f"{LIVE_API}/wellness/journal",
        headers=headers_a,
        json={"title": "😊 Mood: Happy", "content": "Feeling energetic today!"},
    )
    assert r_journal_a.status_code == 200
    assert r_journal_a.json()["title"] == "😊 Mood: Happy"
    assert r_journal_a.json()["content"] == "Feeling energetic today!"

    # 4. User A fetches journal history -> should contain the created journal
    r_list_a = requests.get(f"{LIVE_API}/wellness/journal", headers=headers_a)
    assert r_list_a.status_code == 200
    journals_a = r_list_a.json()
    assert len(journals_a) >= 1
    assert any(j["title"] == "😊 Mood: Happy" for j in journals_a)

    # 5. User A fetches mood history -> should contain the created mood
    r_moods_a = requests.get(f"{LIVE_API}/wellness/mood", headers=headers_a)
    assert r_moods_a.status_code == 200
    moods_a = r_moods_a.json()
    assert len(moods_a) >= 1
    assert any(m["mood"] == "happy" for m in moods_a)

    # 6. User B fetches journal history -> should NOT see User A's journals (isolation)
    r_list_b = requests.get(f"{LIVE_API}/wellness/journal", headers=headers_b)
    assert r_list_b.status_code == 200
    journals_b = r_list_b.json()
    assert len(journals_b) == 0

    # 7. User B fetches moods -> should NOT see User A's moods (isolation)
    r_moods_b = requests.get(f"{LIVE_API}/wellness/mood", headers=headers_b)
    assert r_moods_b.status_code == 200
    assert len(r_moods_b.json()) == 0

    # 8. User B creates mood without note (optional note = None)
    r_mood_b = requests.post(
        f"{LIVE_API}/wellness/mood",
        headers=headers_b,
        json={"mood": "calm" if False else "tired", "note": None},
    )
    assert r_mood_b.status_code == 200
    assert r_mood_b.json()["mood"] == "tired"
    assert r_mood_b.json()["note"] is None
