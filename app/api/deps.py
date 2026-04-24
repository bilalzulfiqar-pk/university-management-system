from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.constants import UserRole
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.logging import log_security_event
from app.core.security import decode_access_token, ensure_utc_datetime
from app.core.token_blocklist import access_token_blocklist
from app.db.session import get_db
from app.models.auth_session import AuthSession
from app.models.user import User


SessionDep = Annotated[Session, Depends(get_db)]

ALLOWED_PASSWORD_CHANGE_PATHS = {
    "/api/v1/auth/change-password",
    "/api/v1/auth/logout",
    "/api/v1/auth/me",
    "/api/v1/auth/refresh",
}


def get_current_user(
    request: Request,
    db: SessionDep,
) -> User:
    token = request.cookies.get(settings.access_cookie_name)
    if token is None:
        raise UnauthorizedError(code="AUTH_REQUIRED", message="Authentication required.")

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    token_version = payload.get("token_version")
    session_id = payload.get("session_id")
    jti = payload.get("jti")
    if user_id is None or token_version is None or session_id is None or jti is None:
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    if access_token_blocklist.contains(str(jti)):
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    stmt = (
        select(User)
        .options(selectinload(User.student), selectinload(User.teacher))
        .where(User.id == int(user_id))
    )
    user = db.scalar(stmt)
    if user is None or user.deleted_at is not None or not user.is_active:
        log_security_event("auth_rejected", user_id=user_id, reason="inactive_or_deleted")
        raise UnauthorizedError(code="AUTH_REQUIRED", message="Authentication required.")
    if user.token_version != int(token_version):
        log_security_event("auth_rejected", user_id=user.id, reason="token_version_mismatch")
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    session = db.scalar(
        select(AuthSession).where(
            AuthSession.id == str(session_id),
            AuthSession.user_id == user.id,
        )
    )
    if session is None or session.revoked_at is not None or ensure_utc_datetime(session.expires_at) <= request.state.now_utc:
        log_security_event("auth_rejected", user_id=user.id, reason="session_invalid", session_id=session_id)
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    request.state.user_id = user.id
    request.state.user_role = user.role
    request.state.auth_session_id = session.id
    if user.must_change_password and request.url.path not in ALLOWED_PASSWORD_CHANGE_PATHS:
        log_security_event("password_change_required", user_id=user.id, path=request.url.path)
        raise ForbiddenError(
            code="PASSWORD_CHANGE_REQUIRED",
            message="You must change your password before continuing.",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: UserRole) -> Callable[[CurrentUser], User]:
    allowed = {role.value for role in roles}

    def dependency(user: CurrentUser) -> User:
        if user.role not in allowed:
            log_security_event("forbidden_role_access", user_id=user.id, role=user.role, allowed_roles=sorted(allowed))
            raise ForbiddenError(code="FORBIDDEN", message="You do not have permission to do this.")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN))]
TeacherUser = Annotated[User, Depends(require_role(UserRole.TEACHER))]
StudentUser = Annotated[User, Depends(require_role(UserRole.STUDENT))]
