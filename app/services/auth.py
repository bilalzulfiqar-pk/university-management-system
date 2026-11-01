from __future__ import annotations

from datetime import datetime, timezone

import pyotp
from fastapi import Request, Response
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.constants import UserRole
from app.core.cookies import clear_auth_cookies, set_access_cookie, set_csrf_cookie, set_refresh_cookie
from app.core.exceptions import BadRequestError, UnauthorizedError
from app.core.logging import log_security_event
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.security import (
    build_refresh_token,
    create_access_token,
    ensure_utc_datetime,
    generate_csrf_secret,
    generate_refresh_secret,
    hash_password,
    hash_refresh_token,
    refresh_expiry_from_now,
    split_refresh_token,
    try_decode_access_token,
    utcnow,
    verify_password,
)
from app.core.token_blocklist import access_token_blocklist
from app.models.auth_session import AuthSession
from app.models.user import User
from app.schemas.auth import AuthMeResponse, ChangePasswordRequest, LoginRequest, SessionResponse
from app.schemas.auth import TotpCodeRequest, TotpSetupResponse, TotpStatusResponse
from app.services.common import commit_or_rollback
from app.services.serializers import serialize_auth_user


login_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.login_rate_limit_attempts,
    window_seconds=settings.login_rate_limit_window_seconds,
    error_message="Too many login attempts. Please try again later.",
    namespace="login-account",
)

login_ip_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.login_ip_rate_limit_attempts,
    window_seconds=settings.login_ip_rate_limit_window_seconds,
    error_message="Too many login attempts from this IP. Please try again later.",
    namespace="login-ip",
)

change_password_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.change_password_rate_limit_attempts,
    window_seconds=settings.change_password_rate_limit_window_seconds,
    error_message="Too many password change attempts. Please try again later.",
    namespace="change-password",
)

refresh_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.refresh_rate_limit_attempts,
    window_seconds=settings.refresh_rate_limit_window_seconds,
    error_message="Too many session refresh attempts. Please try again later.",
    namespace="refresh",
)


def get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def get_client_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def get_client_key(request: Request, email: str) -> str:
    return f"{get_client_ip(request)}:{email.lower()}"


def get_access_cookie(request: Request) -> str | None:
    return request.cookies.get(settings.access_cookie_name)


def get_refresh_cookie(request: Request) -> str | None:
    return request.cookies.get(settings.refresh_cookie_name)


def get_csrf_cookie(request: Request) -> str | None:
    return request.cookies.get(settings.csrf_cookie_name)


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, request: Request, response: Response, payload: LoginRequest) -> SessionResponse:
        rate_limit_key = get_client_key(request, payload.email)
        client_ip_key = get_client_ip(request)
        login_ip_rate_limiter.check(client_ip_key)
        login_rate_limiter.check(rate_limit_key)

        stmt = (
            select(User)
            .options(selectinload(User.student), selectinload(User.teacher))
            .where(func.lower(User.email) == payload.email.lower())
        )
        user = self.db.scalar(stmt)
        if user is None or user.deleted_at is not None or not user.is_active:
            log_security_event("login_failed", email=payload.email.lower(), ip=get_client_ip(request), reason="invalid_credentials")
            raise UnauthorizedError(code="INVALID_CREDENTIALS", message="Invalid email or password.")
        if not verify_password(payload.password, user.password_hash):
            log_security_event("login_failed", email=payload.email.lower(), ip=get_client_ip(request), reason="invalid_credentials")
            raise UnauthorizedError(code="INVALID_CREDENTIALS", message="Invalid email or password.")
        if user.totp_enabled:
            if not payload.totp_code:
                log_security_event("login_totp_required", user_id=user.id, ip=get_client_ip(request))
                raise UnauthorizedError(code="TOTP_REQUIRED", message="Authenticator code is required.")
            if not self._verify_totp_code(user, payload.totp_code):
                log_security_event("login_failed", user_id=user.id, ip=get_client_ip(request), reason="invalid_totp")
                raise UnauthorizedError(code="INVALID_TOTP_CODE", message="Authenticator code is invalid.")

        login_rate_limiter.clear(rate_limit_key)
        login_ip_rate_limiter.clear(client_ip_key)
        user.last_login_at = utcnow()
        access_expires_at, refresh_expires_at = self._issue_session(user, request, response)
        commit_or_rollback(self.db)
        log_security_event("login_succeeded", user_id=user.id, role=user.role, ip=get_client_ip(request))
        return self._build_session_response(user, access_expires_at, refresh_expires_at)

    def refresh(self, request: Request, response: Response) -> SessionResponse:
        refresh_rate_limiter.check(f"ip:{get_client_ip(request)}")
        session, user = self._authenticate_refresh_session(request)
        if user.deleted_at is not None or not user.is_active:
            session.revoked_at = utcnow()
            commit_or_rollback(self.db)
            clear_auth_cookies(response)
            log_security_event("refresh_failed", user_id=user.id, reason="inactive_or_deleted", ip=get_client_ip(request))
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")

        session.last_used_at = utcnow()
        session.last_used_ip = get_client_ip(request)
        session.last_used_user_agent = get_client_user_agent(request)
        access_expires_at, refresh_expires_at = self._rotate_session(session, user, response)
        commit_or_rollback(self.db)
        log_security_event("refresh_succeeded", user_id=user.id, session_id=session.id, ip=get_client_ip(request))
        return self._build_session_response(user, access_expires_at, refresh_expires_at)

    def logout(self, request: Request, response: Response, user: User) -> dict[str, bool | str]:
        session_id = getattr(request.state, "auth_session_id", None)
        if session_id:
            session = self.db.scalar(
                select(AuthSession).where(AuthSession.id == session_id, AuthSession.user_id == user.id)
            )
            if session is not None and session.revoked_at is None:
                session.revoked_at = utcnow()

        self._block_current_access_token(request)
        clear_auth_cookies(response)
        commit_or_rollback(self.db)
        log_security_event("logout_succeeded", user_id=user.id, session_id=session_id, ip=get_client_ip(request))
        return {"success": True, "message": "Logged out successfully."}

    def change_password(
        self,
        request: Request,
        response: Response,
        user: User,
        payload: ChangePasswordRequest,
    ) -> dict[str, bool | str]:
        change_password_rate_limiter.check(f"user:{user.id}")
        if not verify_password(payload.current_password, user.password_hash):
            log_security_event("password_change_failed", user_id=user.id, reason="invalid_current_password")
            raise BadRequestError(code="INVALID_PASSWORD", message="Current password is incorrect.")

        if verify_password(payload.new_password, user.password_hash):
            raise BadRequestError(
                code="PASSWORD_UNCHANGED",
                message="New password must be different from the current password.",
            )

        user.password_hash = hash_password(payload.new_password)
        user.must_change_password = False
        user.token_version += 1
        user.last_login_at = utcnow()
        self._revoke_all_user_sessions(user.id)
        self._issue_session(user, request, response)
        commit_or_rollback(self.db)
        change_password_rate_limiter.clear(f"user:{user.id}")
        log_security_event("password_changed", user_id=user.id, ip=get_client_ip(request))
        return {"success": True, "message": "Password changed successfully."}

    def me(self, user: User) -> AuthMeResponse:
        return serialize_auth_user(user)

    def totp_status(self, user: User) -> TotpStatusResponse:
        return TotpStatusResponse(enabled=user.totp_enabled)

    def begin_totp_setup(self, user: User) -> TotpSetupResponse:
        if user.totp_enabled:
            raise BadRequestError(code="TOTP_ALREADY_ENABLED", message="Authenticator app is already enabled.")

        secret = pyotp.random_base32()
        user.totp_secret = secret
        commit_or_rollback(self.db)
        provisioning_uri = self._build_totp(user).provisioning_uri(name=user.email, issuer_name=settings.app_name)
        log_security_event("totp_setup_started", user_id=user.id)
        return TotpSetupResponse(secret=secret, provisioning_uri=provisioning_uri)

    def enable_totp(self, user: User, payload: TotpCodeRequest) -> dict[str, bool | str]:
        if user.totp_secret is None:
            raise BadRequestError(code="TOTP_SETUP_REQUIRED", message="Start authenticator setup before enabling it.")
        if user.totp_enabled:
            raise BadRequestError(code="TOTP_ALREADY_ENABLED", message="Authenticator app is already enabled.")
        if not self._verify_totp_code(user, payload.code):
            raise BadRequestError(code="INVALID_TOTP_CODE", message="Authenticator code is invalid.")

        user.totp_enabled = True
        commit_or_rollback(self.db)
        log_security_event("totp_enabled", user_id=user.id)
        return {"success": True, "message": "Authenticator app enabled successfully."}

    def disable_totp(self, user: User, payload: TotpCodeRequest) -> dict[str, bool | str]:
        if not user.totp_enabled or user.totp_secret is None:
            raise BadRequestError(code="TOTP_NOT_ENABLED", message="Authenticator app is not enabled.")
        if not self._verify_totp_code(user, payload.code):
            raise BadRequestError(code="INVALID_TOTP_CODE", message="Authenticator code is invalid.")

        user.totp_enabled = False
        user.totp_secret = None
        commit_or_rollback(self.db)
        log_security_event("totp_disabled", user_id=user.id)
        return {"success": True, "message": "Authenticator app disabled successfully."}

    def _build_session_response(
        self,
        user: User,
        access_expires_at: datetime,
        refresh_expires_at: datetime,
    ) -> SessionResponse:
        now = datetime.now(timezone.utc)
        return SessionResponse(
            expires_in=max(int((access_expires_at - now).total_seconds()), 0),
            refresh_expires_in=max(int((refresh_expires_at - now).total_seconds()), 0),
            user=serialize_auth_user(user),
        )

    def _issue_session(self, user: User, request: Request, response: Response) -> tuple[datetime, datetime]:
        refresh_secret = generate_refresh_secret()
        csrf_secret = generate_csrf_secret()
        refresh_expires_at = refresh_expiry_from_now()
        session = AuthSession(
            user_id=user.id,
            refresh_token_hash=hash_refresh_token(refresh_secret),
            csrf_secret=csrf_secret,
            expires_at=refresh_expires_at,
            last_used_at=utcnow(),
            created_ip=get_client_ip(request),
            created_user_agent=get_client_user_agent(request),
            last_used_ip=get_client_ip(request),
            last_used_user_agent=get_client_user_agent(request),
        )
        self.db.add(session)
        self.db.flush()

        access_token, access_expires_at, _ = create_access_token(
            user_id=user.id,
            role=UserRole(user.role),
            token_version=user.token_version,
            session_id=session.id,
        )
        refresh_token = build_refresh_token(session.id, refresh_secret)
        set_access_cookie(response, access_token, access_expires_at)
        set_refresh_cookie(response, refresh_token, refresh_expires_at)
        set_csrf_cookie(response, csrf_secret, refresh_expires_at)
        return access_expires_at, refresh_expires_at

    def _rotate_session(self, session: AuthSession, user: User, response: Response) -> tuple[datetime, datetime]:
        refresh_secret = generate_refresh_secret()
        session.refresh_token_hash = hash_refresh_token(refresh_secret)
        session.expires_at = refresh_expiry_from_now()

        access_token, access_expires_at, _ = create_access_token(
            user_id=user.id,
            role=UserRole(user.role),
            token_version=user.token_version,
            session_id=session.id,
        )
        refresh_token = build_refresh_token(session.id, refresh_secret)
        set_access_cookie(response, access_token, access_expires_at)
        set_refresh_cookie(response, refresh_token, session.expires_at)
        set_csrf_cookie(response, session.csrf_secret, session.expires_at)
        return access_expires_at, session.expires_at

    def _authenticate_refresh_session(self, request: Request) -> tuple[AuthSession, User]:
        token = get_refresh_cookie(request)
        if token is None:
            raise UnauthorizedError(code="REFRESH_REQUIRED", message="Refresh authentication required.")

        session_id, refresh_secret = split_refresh_token(token)
        session = self.db.scalar(
            select(AuthSession)
            .join(AuthSession.user)
            .options(
                selectinload(AuthSession.user).selectinload(User.student),
                selectinload(AuthSession.user).selectinload(User.teacher),
            )
            .where(AuthSession.id == session_id)
        )
        if session is None:
            log_security_event("refresh_failed", session_id=session_id, reason="session_not_found", ip=get_client_ip(request))
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")

        if session.revoked_at is not None or ensure_utc_datetime(session.expires_at) <= utcnow():
            log_security_event("refresh_failed", session_id=session.id, reason="session_revoked_or_expired", ip=get_client_ip(request))
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")

        if session.refresh_token_hash != hash_refresh_token(refresh_secret):
            session.revoked_at = utcnow()
            commit_or_rollback(self.db)
            log_security_event("refresh_reuse_detected", session_id=session.id, user_id=session.user_id, ip=get_client_ip(request))
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")

        if session.user.deleted_at is not None or not session.user.is_active:
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")
        return session, session.user

    def _block_current_access_token(self, request: Request) -> None:
        access_token = get_access_cookie(request)
        if access_token is None:
            return
        payload = try_decode_access_token(access_token)
        if payload is None:
            return
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti is None or exp is None:
            return
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
        access_token_blocklist.block(str(jti), expires_at)

    def _revoke_all_user_sessions(self, user_id: int) -> None:
        self.db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )

    def _build_totp(self, user: User) -> pyotp.TOTP:
        if user.totp_secret is None:
            raise BadRequestError(code="TOTP_SETUP_REQUIRED", message="Authenticator setup is not available.")
        return pyotp.TOTP(user.totp_secret)

    def _verify_totp_code(self, user: User, code: str) -> bool:
        if user.totp_secret is None:
            return False
        return bool(pyotp.TOTP(user.totp_secret).verify(code, valid_window=1))


def create_admin_user(
    *,
    db: Session,
    email: str,
    password: str,
) -> User:
    stmt = select(User).where(func.lower(User.email) == email.lower())
    existing = db.scalar(stmt)
    if existing is not None:
        existing.password_hash = hash_password(password)
        existing.is_active = True
        commit_or_rollback(db)
        return existing

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        role=UserRole.ADMIN.value,
        is_active=True,
        must_change_password=False,
        token_version=0,
    )
    db.add(user)
    commit_or_rollback(db)
    return user
