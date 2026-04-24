from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import (
    IdentifierStr,
    NameStr,
    TimestampedModel,
    ensure_identifier,
    ensure_name,
    validate_password_strength,
)

EXAMPLE_STUDENT_TEMP_PASSWORD = "Student123!"  # nosec B105


class StudentCreate(BaseModel):
    email: EmailStr
    temporary_password: str = Field(min_length=8, max_length=128)
    first_name: Annotated[str, NameStr]
    last_name: Annotated[str, NameStr]
    roll_number: Annotated[str, IdentifierStr]
    department_id: int = Field(gt=0)
    current_semester: int = Field(ge=1, le=12)
    is_active: bool = True

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "student1@example.com",
                "temporary_password": EXAMPLE_STUDENT_TEMP_PASSWORD,
                "first_name": "Ali",
                "last_name": "Raza",
                "roll_number": "ST-001",
                "department_id": 1,
                "current_semester": 5,
                "is_active": True,
            }
        }
    }

    @field_validator("temporary_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_names(cls, value: str, info) -> str:
        return ensure_name(value, field_name=info.field_name.replace("_", " ").title())

    @field_validator("roll_number")
    @classmethod
    def normalize_roll_number(cls, value: str) -> str:
        return ensure_identifier(value, field_name="Roll number")


class StudentUpdate(BaseModel):
    email: EmailStr | None = None
    temporary_password: str | None = Field(default=None, min_length=8, max_length=128)
    first_name: Annotated[str, NameStr] | None = None
    last_name: Annotated[str, NameStr] | None = None
    roll_number: Annotated[str, IdentifierStr] | None = None
    department_id: int | None = Field(default=None, gt=0)
    current_semester: int | None = Field(default=None, ge=1, le=12)
    is_active: bool | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "first_name": "Bilal",
                "current_semester": 6,
                "is_active": True,
            }
        }
    }

    @field_validator("temporary_password")
    @classmethod
    def validate_password(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_password_strength(value)

    @field_validator("first_name", "last_name")
    @classmethod
    def normalize_names(cls, value: str | None, info) -> str | None:
        if value is None:
            return None
        return ensure_name(value, field_name=info.field_name.replace("_", " ").title())

    @field_validator("roll_number")
    @classmethod
    def normalize_roll_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_identifier(value, field_name="Roll number")


class StudentRead(TimestampedModel):
    user_id: int
    email: EmailStr
    is_active: bool
    must_change_password: bool
    first_name: str
    last_name: str
    roll_number: str
    department_id: int
    current_semester: int
