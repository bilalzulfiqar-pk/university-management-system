from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.constants import UserRole
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=False)

SessionDep = Annotated[Session, Depends(get_db)]

ALLOWED_PASSWORD_CHANGE_PATHS = {
    "/api/v1/auth/change-password",
    "/api/v1/auth/logout",
    "/api/v1/auth/me",
}


def get_current_user(
    request: Request,
    db: SessionDep,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
    if credentials is None:
        raise UnauthorizedError(code="AUTH_REQUIRED", message="Authentication required.")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    token_version = payload.get("token_version")
    if user_id is None or token_version is None:
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    stmt = (
        select(User)
        .options(selectinload(User.student), selectinload(User.teacher))
        .where(User.id == int(user_id))
    )
    user = db.scalar(stmt)
    if user is None or user.deleted_at is not None or not user.is_active:
        raise UnauthorizedError(code="AUTH_REQUIRED", message="Authentication required.")
    if user.token_version != int(token_version):
        raise UnauthorizedError(code="INVALID_TOKEN", message="Authentication failed.")

    request.state.user_id = user.id
    request.state.user_role = user.role
    if user.must_change_password and request.url.path not in ALLOWED_PASSWORD_CHANGE_PATHS:
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
            raise ForbiddenError(code="FORBIDDEN", message="You do not have permission to do this.")
        return user

    return dependency


AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN))]
TeacherUser = Annotated[User, Depends(require_role(UserRole.TEACHER))]
StudentUser = Annotated[User, Depends(require_role(UserRole.STUDENT))]
