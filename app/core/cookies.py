from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Response

from app.core.config import settings


def _max_age_from_expiry(expires_at: datetime) -> int:
    return max(int((expires_at - datetime.now(timezone.utc)).total_seconds()), 0)


def set_access_cookie(response: Response, token: str, expires_at: datetime) -> None:
    response.set_cookie(
        key=settings.access_cookie_name,
        value=token,
        max_age=_max_age_from_expiry(expires_at),
        expires=expires_at,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
    )


def set_refresh_cookie(response: Response, refresh_token: str, expires_at: datetime) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=_max_age_from_expiry(expires_at),
        expires=expires_at,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
    )


def set_csrf_cookie(response: Response, csrf_secret: str, expires_at: datetime) -> None:
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=csrf_secret,
        max_age=_max_age_from_expiry(expires_at),
        expires=expires_at,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        domain=settings.cookie_domain,
        path=settings.cookie_path,
    )


def clear_auth_cookies(response: Response) -> None:
    for cookie_name in (
        settings.access_cookie_name,
        settings.refresh_cookie_name,
        settings.csrf_cookie_name,
    ):
        response.delete_cookie(
            key=cookie_name,
            domain=settings.cookie_domain,
            path=settings.cookie_path,
            secure=settings.cookie_secure,
            samesite=settings.cookie_same_site,
        )
