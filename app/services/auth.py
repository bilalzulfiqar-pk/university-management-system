from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.constants import UserRole
from app.core.exceptions import BadRequestError, UnauthorizedError
from app.core.rate_limit import FixedWindowRateLimiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthMeResponse, ChangePasswordRequest, LoginRequest, TokenResponse
from app.services.common import commit_or_rollback, utcnow
from app.services.serializers import serialize_auth_user


login_rate_limiter = FixedWindowRateLimiter(
    max_attempts=settings.login_rate_limit_attempts,
    window_seconds=settings.login_rate_limit_window_seconds,
)


def get_client_key(request: Request, email: str) -> str:
    client_ip = request.client.host if request.client else "unknown"
    return f"{client_ip}:{email.lower()}"


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def login(self, request: Request, payload: LoginRequest) -> TokenResponse:
        rate_limit_key = get_client_key(request, payload.email)
        login_rate_limiter.check(rate_limit_key)

        stmt = (
            select(User)
            .options(selectinload(User.student), selectinload(User.teacher))
            .where(func.lower(User.email) == payload.email.lower())
        )
        user = self.db.scalar(stmt)
        if user is None or user.deleted_at is not None or not user.is_active:
            raise UnauthorizedError(code="INVALID_CREDENTIALS", message="Invalid email or password.")
        if not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError(code="INVALID_CREDENTIALS", message="Invalid email or password.")

        login_rate_limiter.clear(rate_limit_key)
        user.last_login_at = utcnow()
        commit_or_rollback(self.db)

        return TokenResponse(
            access_token=create_access_token(
                user_id=user.id,
                role=UserRole(user.role),
                token_version=user.token_version,
            ),
            expires_in=settings.access_token_expire_minutes * 60,
            user=serialize_auth_user(user),
        )

    def logout(self, user: User) -> dict[str, bool | str]:
        user.token_version += 1
        commit_or_rollback(self.db)
        return {"success": True, "message": "Logged out successfully."}

    def change_password(self, user: User, payload: ChangePasswordRequest) -> dict[str, bool | str]:
        if not verify_password(payload.current_password, user.password_hash):
            raise BadRequestError(code="INVALID_PASSWORD", message="Current password is incorrect.")

        if verify_password(payload.new_password, user.password_hash):
            raise BadRequestError(
                code="PASSWORD_UNCHANGED",
                message="New password must be different from the current password.",
            )

        user.password_hash = hash_password(payload.new_password)
        user.must_change_password = False
        user.token_version += 1
        commit_or_rollback(self.db)
        return {"success": True, "message": "Password changed successfully."}

    def me(self, user: User) -> AuthMeResponse:
        return serialize_auth_user(user)


def create_admin_user(
    *,
    db: Session,
    email: str,
    password: str,
) -> User:
    stmt = select(User).where(func.lower(User.email) == email.lower())
    existing = db.scalar(stmt)
    if existing is not None:
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

