from app.core.constants import UserRole
from app.core.security import create_access_token, hash_password, verify_password


def test_password_hashing_roundtrip():
    password = "StrongPass123!"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True
    assert verify_password("WrongPass123!", password_hash) is False


def test_token_changes_when_token_version_changes():
    token_v0 = create_access_token(user_id=1, role=UserRole.ADMIN, token_version=0)
    token_v1 = create_access_token(user_id=1, role=UserRole.ADMIN, token_version=1)

    assert token_v0 != token_v1

