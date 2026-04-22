from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, SessionDep
from app.schemas.auth import AuthMeResponse, ChangePasswordRequest, LoginRequest, TokenResponse
from app.schemas.common import MessageResponse
from app.services.auth import AuthService


router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: SessionDep) -> TokenResponse:
    return AuthService(db).login(request, payload)


@router.post("/logout", response_model=MessageResponse)
def logout(db: SessionDep, user: CurrentUser) -> MessageResponse:
    result = AuthService(db).logout(user)
    return MessageResponse(**result)


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: SessionDep,
    user: CurrentUser,
) -> MessageResponse:
    result = AuthService(db).change_password(user, payload)
    return MessageResponse(**result)


@router.get("/me", response_model=AuthMeResponse)
def me(db: SessionDep, user: CurrentUser) -> AuthMeResponse:
    return AuthService(db).me(user)

