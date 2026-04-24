from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings
from app.core.constants import UserRole
from app.core.exceptions import UnauthorizedError


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def create_access_token(*, user_id: int, role: UserRole, token_version: int, session_id: str) -> tuple[str, datetime, str]:
    now = utcnow()
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    jti = str(uuid4())
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "session_id": session_id,
        "token_version": token_version,
        "jti": jti,
        "iat": now,
        "nbf": now,
        "exp": expires_at,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")
    return token, expires_at, jti


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.") from exc


def try_decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except jwt.PyJWTError:
        return None


def generate_refresh_secret() -> str:
    return secrets.token_urlsafe(48)


def generate_csrf_secret() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(refresh_secret: str) -> str:
    return hashlib.sha256(refresh_secret.encode("utf-8")).hexdigest()


def build_refresh_token(session_id: str, refresh_secret: str) -> str:
    return f"{session_id}.{refresh_secret}"


def split_refresh_token(token: str) -> tuple[str, str]:
    try:
        session_id, refresh_secret = token.split(".", 1)
    except ValueError as exc:
        raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.") from exc
    if not session_id or not refresh_secret:
        raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")
    return session_id, refresh_secret


def refresh_expiry_from_now() -> datetime:
    return utcnow() + timedelta(days=settings.refresh_token_expire_days)
