from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, SessionDep
from app.schemas.auth import AuthMeResponse, ChangePasswordRequest, LoginRequest, TokenResponse
from app.schemas.common import MessageResponse
from app.services.auth import AuthService


router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login user",
    description="Authenticate with email and password and return a bearer access token.",
)
def login(payload: LoginRequest, request: Request, db: SessionDep) -> TokenResponse:
    return AuthService(db).login(request, payload)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout current user",
    description="Invalidate the current token by incrementing token version for the authenticated user.",
)
def logout(db: SessionDep, user: CurrentUser) -> MessageResponse:
    result = AuthService(db).logout(user)
    return MessageResponse(**result)


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change the current user's password. Student and teacher accounts must do this on first login.",
)
def change_password(
    payload: ChangePasswordRequest,
    db: SessionDep,
    user: CurrentUser,
) -> MessageResponse:
    result = AuthService(db).change_password(user, payload)
    return MessageResponse(**result)


@router.get(
    "/me",
    response_model=AuthMeResponse,
    summary="Get current user",
    description="Return the authenticated user's basic identity, role, and profile linkage information.",
)
def me(db: SessionDep, user: CurrentUser) -> AuthMeResponse:
    return AuthService(db).me(user)
