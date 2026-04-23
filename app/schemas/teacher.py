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


class TeacherCreate(BaseModel):
    email: EmailStr
    temporary_password: str = Field(min_length=8, max_length=128)
    first_name: Annotated[str, NameStr]
    last_name: Annotated[str, NameStr]
    employee_id: Annotated[str, IdentifierStr]
    department_id: int = Field(gt=0)
    is_active: bool = True

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "teacher1@example.com",
                "temporary_password": "Teacher123!",
                "first_name": "Sara",
                "last_name": "Khan",
                "employee_id": "EMP-001",
                "department_id": 1,
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

    @field_validator("employee_id")
    @classmethod
    def normalize_employee_id(cls, value: str) -> str:
        return ensure_identifier(value, field_name="Employee ID")


class TeacherUpdate(BaseModel):
    email: EmailStr | None = None
    temporary_password: str | None = Field(default=None, min_length=8, max_length=128)
    first_name: Annotated[str, NameStr] | None = None
    last_name: Annotated[str, NameStr] | None = None
    employee_id: Annotated[str, IdentifierStr] | None = None
    department_id: int | None = Field(default=None, gt=0)
    is_active: bool | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "last_name": "Ahmed",
                "department_id": 2,
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

    @field_validator("employee_id")
    @classmethod
    def normalize_employee_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_identifier(value, field_name="Employee ID")


class TeacherRead(TimestampedModel):
    user_id: int
    email: EmailStr
    is_active: bool
    must_change_password: bool
    first_name: str
    last_name: str
    employee_id: str
    department_id: int
