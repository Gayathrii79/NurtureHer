import pytest

from app.core.exceptions import AppError
from app.utils.encryption import decrypt_text, encrypt_text
from app.utils.passwords import validate_password_policy


def test_encryption_round_trip():
    value = "sensitive-health-note"
    encrypted = encrypt_text(value)
    assert encrypted != value
    assert decrypt_text(encrypted) == value


def test_password_policy_accepts_strong_password():
    validate_password_policy("Strong@123")


def test_password_policy_rejects_weak_password():
    with pytest.raises(AppError):
        validate_password_policy("password")
