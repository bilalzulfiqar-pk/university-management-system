from fastapi import APIRouter, Depends, Request, Response

from app.api.deps import CurrentUser, SessionDep, document_csrf_header
from app.schemas.auth import AuthMeResponse, ChangePasswordRequest, LoginRequest, SessionResponse
from app.schemas.common import MessageResponse
from app.services.auth import AuthService


router = APIRouter()


@router.post(
    "/login",
    response_model=SessionResponse,
    summary="Login user",
    description="Authenticate with email and password and establish a secure cookie-backed session.",
)
def login(payload: LoginRequest, request: Request, response: Response, db: SessionDep) -> SessionResponse:
    return AuthService(db).login(request, response, payload)


@router.post(
    "/refresh",
    response_model=SessionResponse,
    summary="Refresh current session",
    description="Rotate the refresh session and renew access cookies using the active refresh cookie.",
    dependencies=[Depends(document_csrf_header)],
)
def refresh(request: Request, response: Response, db: SessionDep) -> SessionResponse:
    return AuthService(db).refresh(request, response)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout current user",
    description="Revoke the current session and clear authentication cookies.",
    dependencies=[Depends(document_csrf_header)],
)
def logout(request: Request, response: Response, db: SessionDep, user: CurrentUser) -> MessageResponse:
    result = AuthService(db).logout(request, response, user)
    return MessageResponse(**result)


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change the current user's password. Student and teacher accounts must do this on first login.",
    dependencies=[Depends(document_csrf_header)],
)
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    db: SessionDep,
    user: CurrentUser,
) -> MessageResponse:
    result = AuthService(db).change_password(request, response, user, payload)
    return MessageResponse(**result)


@router.get(
    "/me",
    response_model=AuthMeResponse,
    summary="Get current user",
    description="Return the authenticated user's basic identity, role, and profile linkage information.",
)
def me(db: SessionDep, user: CurrentUser) -> AuthMeResponse:
    return AuthService(db).me(user)
