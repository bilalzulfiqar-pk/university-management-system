import json
import logging
import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.error_handlers import build_error_response
from app.core.exceptions import TooManyRequestsError
from app.core.security import try_decode_access_token
from app.core.rate_limit import FixedWindowRateLimiter
from app.db.session import SessionLocal
from app.models.audit_log import AdminAuditLog


logger = logging.getLogger("ums")

read_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.api_read_rate_limit_attempts,
    window_seconds=settings.api_read_rate_limit_window_seconds,
    error_message="Too many read requests. Please try again later.",
)
write_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.api_write_rate_limit_attempts,
    window_seconds=settings.api_write_rate_limit_window_seconds,
    error_message="Too many write requests. Please try again later.",
)


def _get_request_subject(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        payload = try_decode_access_token(auth_header.removeprefix("Bearer ").strip())
        if payload is not None and payload.get("sub") is not None:
            return f"user:{payload['sub']}"
    return f"ip:{request.client.host if request.client else 'unknown'}"


def _record_admin_audit_log(request: Request, status_code: int) -> None:
    if not request.url.path.startswith("/api/v1/admin"):
        return
    if request.method not in {"POST", "PATCH", "DELETE"}:
        return

    db = SessionLocal()
    try:
        entry = AdminAuditLog(
            actor_user_id=getattr(request.state, "user_id", None),
            actor_role=getattr(request.state, "user_role", None),
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            request_id=getattr(request.state, "request_id", None),
            client_ip=request.client.host if request.client else None,
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to write admin audit log.")
    finally:
        db.close()


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid4())
        request.state.request_id = request_id
        try:
            if request.url.path.startswith("/api/v1"):
                subject = _get_request_subject(request)
                if request.method == "GET":
                    read_rate_limiter.check(subject)
                elif request.method in {"POST", "PATCH", "DELETE"} and request.url.path != "/api/v1/auth/login":
                    write_rate_limiter.check(subject)
        except TooManyRequestsError as exc:
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

        logger.info(
            json.dumps(
                {
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "client": request.client.host if request.client else None,
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
            allow_credentials=False,
            allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        )
