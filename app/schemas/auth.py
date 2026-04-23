from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.constants import UserRole
from app.schemas.common import validate_password_strength


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "admin@example.com",
                "password": "ChangeMe123!",
            }
        }
    }


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_password": "Teacher123!",
                "new_password": "TeacherNew123!",
            }
        }
    }

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)


class AuthMeResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    must_change_password: bool
    profile_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthMeResponse
