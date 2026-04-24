from fastapi import APIRouter, Depends, Request, Response

from app.api.deps import CurrentUser, SessionDep, document_csrf_header
from app.schemas.auth import (
    AuthMeResponse,
    ChangePasswordRequest,
    LoginRequest,
    SessionResponse,
    TotpCodeRequest,
    TotpSetupResponse,
    TotpStatusResponse,
)
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


@router.get(
    "/totp",
    response_model=TotpStatusResponse,
    summary="Get authenticator app status",
    description="Return whether TOTP/Google Authenticator is currently enabled for the authenticated user.",
)
def totp_status(db: SessionDep, user: CurrentUser) -> TotpStatusResponse:
    return AuthService(db).totp_status(user)


@router.post(
    "/totp/setup",
    response_model=TotpSetupResponse,
    summary="Start authenticator app setup",
    description="Generate a TOTP secret and provisioning URI for Google Authenticator style apps.",
    dependencies=[Depends(document_csrf_header)],
)
def setup_totp(db: SessionDep, user: CurrentUser) -> TotpSetupResponse:
    return AuthService(db).begin_totp_setup(user)


@router.post(
    "/totp/enable",
    response_model=MessageResponse,
    summary="Enable authenticator app",
    description="Verify a six-digit authenticator code and enable TOTP for future logins.",
    dependencies=[Depends(document_csrf_header)],
)
def enable_totp(payload: TotpCodeRequest, db: SessionDep, user: CurrentUser) -> MessageResponse:
    result = AuthService(db).enable_totp(user, payload)
    return MessageResponse(**result)


@router.post(
    "/totp/disable",
    response_model=MessageResponse,
    summary="Disable authenticator app",
    description="Verify a six-digit authenticator code and disable TOTP for the authenticated user.",
    dependencies=[Depends(document_csrf_header)],
)
def disable_totp(payload: TotpCodeRequest, db: SessionDep, user: CurrentUser) -> MessageResponse:
    result = AuthService(db).disable_totp(user, payload)
    return MessageResponse(**result)
