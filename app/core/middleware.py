from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Request
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

from app.core.audit import AuditContext
from app.core.config import settings
from app.core.error_handlers import build_error_response
from app.core.exceptions import ForbiddenError, TooManyRequestsError, UnauthorizedError
from app.core.logging import log_security_event
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.security import ensure_utc_datetime, split_refresh_token, try_decode_access_token
from app.db.session import SessionLocal
from app.models.audit_log import AdminAuditLog
from app.models.auth_session import AuthSession


logger = logging.getLogger("ums")
MUTATING_METHODS = {"POST", "PATCH", "DELETE"}

read_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.api_read_rate_limit_attempts,
    window_seconds=settings.api_read_rate_limit_window_seconds,
    error_message="Too many read requests. Please try again later.",
    namespace="api-read",
)
write_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.api_write_rate_limit_attempts,
    window_seconds=settings.api_write_rate_limit_window_seconds,
    error_message="Too many write requests. Please try again later.",
    namespace="api-write",
)
csrf_failure_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.csrf_failure_rate_limit_attempts,
    window_seconds=settings.csrf_failure_rate_limit_window_seconds,
    error_message="Too many invalid CSRF attempts. Please try again later.",
    namespace="csrf-failure",
)


def _get_request_subject(request: Request) -> str:
    access_token = request.cookies.get(settings.access_cookie_name)
    if access_token:
        payload = try_decode_access_token(access_token)
        if payload is not None and payload.get("sub") is not None:
            return f"user:{payload['sub']}"
    return f"ip:{request.client.host if request.client else 'unknown'}"


def _get_request_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _record_admin_audit_log(request: Request, status_code: int) -> None:
    if not request.url.path.startswith("/api/v1/admin"):
        return
    if request.method not in MUTATING_METHODS:
        return

    audit_context: AuditContext | None = getattr(request.state, "audit_context", None)
    if audit_context is None:
        audit_context = AuditContext(
            action=request.method,
            entity_type="unknown",
            entity_id=None,
            entity_label=None,
            description=f"Admin performed {request.method} on {request.url.path}.",
        )

    db = SessionLocal()
    try:
        entry = AdminAuditLog(
            actor_user_id=getattr(request.state, "user_id", None),
            actor_role=getattr(request.state, "user_role", None),
            action=audit_context.action,
            entity_type=audit_context.entity_type,
            entity_id=audit_context.entity_id,
            entity_label=audit_context.entity_label,
            description=audit_context.description,
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            request_id=getattr(request.state, "request_id", None),
            client_ip=_get_request_ip(request),
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to write admin audit log.")
    finally:
        db.close()


def _build_allowed_origins(request: Request) -> set[str]:
    origins = {origin.rstrip("/") for origin in settings.trusted_origins}
    origins.update(origin.rstrip("/") for origin in settings.cors_origins)
    origins.add(str(request.base_url).rstrip("/"))
    return origins


def _should_validate_origin(request: Request) -> bool:
    return request.url.path.startswith("/api/v1") and request.method in MUTATING_METHODS and request.url.path != "/api/v1/auth/login"


def _validate_origin(request: Request) -> None:
    if not _should_validate_origin(request):
        return
    origin = request.headers.get("Origin")
    allowed_origins = _build_allowed_origins(request)
    if origin is None or origin.rstrip("/") not in allowed_origins:
        log_security_event("origin_rejected", path=request.url.path, origin=origin, ip=_get_request_ip(request))
        raise ForbiddenError(code="INVALID_ORIGIN", message="Request origin is not allowed.")


def _should_validate_csrf(request: Request) -> bool:
    if not request.url.path.startswith("/api/v1") or request.method not in MUTATING_METHODS:
        return False
    return request.url.path != "/api/v1/auth/login"


def _resolve_csrf_session_id(request: Request) -> str | None:
    if request.url.path == "/api/v1/auth/refresh":
        refresh_token = request.cookies.get(settings.refresh_cookie_name)
        if not refresh_token:
            return None
        try:
            session_id, _ = split_refresh_token(refresh_token)
            return session_id
        except UnauthorizedError:
            return None

    access_token = request.cookies.get(settings.access_cookie_name)
    if not access_token:
        return None
    payload = try_decode_access_token(access_token)
    if payload is None:
        return None
    session_id = payload.get("session_id")
    return str(session_id) if session_id is not None else None


def _validate_csrf(request: Request) -> None:
    if not _should_validate_csrf(request):
        return

    session_id = _resolve_csrf_session_id(request)
    if session_id is None:
        return

    csrf_cookie = request.cookies.get(settings.csrf_cookie_name)
    csrf_header = request.headers.get("X-CSRF-Token")
    failure_key = f"ip:{_get_request_ip(request)}"

    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        csrf_failure_rate_limiter.check(failure_key)
        log_security_event("csrf_rejected", path=request.url.path, session_id=session_id, reason="header_cookie_mismatch")
        raise ForbiddenError(code="CSRF_FAILED", message="CSRF validation failed.")

    db = SessionLocal()
    try:
        session = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        session_invalid = (
            session is None
            or session.revoked_at is not None
            or ensure_utc_datetime(session.expires_at) <= request.state.now_utc
        )
        if session_invalid:
            log_security_event("csrf_rejected", path=request.url.path, session_id=session_id, reason="session_mismatch")
            if request.url.path == "/api/v1/auth/refresh":
                raise UnauthorizedError(code="INVALID_REFRESH_TOKEN", message="Refresh authentication failed.")
            csrf_failure_rate_limiter.check(failure_key)
            raise ForbiddenError(code="CSRF_FAILED", message="CSRF validation failed.")

        if session.csrf_secret != csrf_header:
            csrf_failure_rate_limiter.check(failure_key)
            log_security_event("csrf_rejected", path=request.url.path, session_id=session_id, reason="session_mismatch")
            raise ForbiddenError(code="CSRF_FAILED", message="CSRF validation failed.")
    finally:
        db.close()


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid4())
        request.state.request_id = request_id
        request.state.now_utc = datetime.now(timezone.utc)

        try:
            if request.url.path.startswith("/api/v1"):
                subject = _get_request_subject(request)
                if request.method == "GET":
                    read_rate_limiter.check(subject)
                elif request.method in MUTATING_METHODS and request.url.path != "/api/v1/auth/login":
                    write_rate_limiter.check(subject)
                _validate_origin(request)
                _validate_csrf(request)
        except (TooManyRequestsError, ForbiddenError, UnauthorizedError) as exc:
            if isinstance(exc, TooManyRequestsError):
                log_security_event("rate_limit_blocked", path=request.url.path, method=request.method, ip=_get_request_ip(request))
            return build_error_response(
                request=request,
                status_code=exc.status_code,
                code=exc.code,
                message=exc.message,
                details=exc.details,
            )

        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        _record_admin_audit_log(request, response.status_code)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-MS"] = str(duration_ms)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        if request.url.path.startswith("/api/v1/auth"):
            response.headers["Cache-Control"] = "no-store"

        logger.info(
            json.dumps(
                {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "client": _get_request_ip(request),
                    "user_id": getattr(request.state, "user_id", None),
                }
            )
        )
        return response


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestContextMiddleware)
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID"],
        )
