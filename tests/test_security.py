import pytest

from app.core.config import Settings
from app.core.constants import UserRole
from app.core.security import create_access_token, hash_password, verify_password


def test_password_hashing_roundtrip():
    password = "StrongPass123!"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True
    assert verify_password("WrongPass123!", password_hash) is False


def test_token_changes_when_token_version_changes():
    token_v0, _, _ = create_access_token(user_id=1, role=UserRole.ADMIN, token_version=0, session_id="session-a")
    token_v1, _, _ = create_access_token(user_id=1, role=UserRole.ADMIN, token_version=1, session_id="session-b")

    assert token_v0 != token_v1


def test_production_runtime_security_validation_rejects_insecure_defaults():
    settings = Settings(
        environment="production",
        debug=True,
        show_docs=True,
        secret_key="x" * 40,
        admin_password="ChangeMe123!",
        cors_origins=[],
        trusted_origins=[],
        redis_url=None,
        cookie_secure=False,
    )

    with pytest.raises(RuntimeError):
        settings.validate_runtime_security()
