from typing import Annotated

from pydantic import BaseModel, field_validator

from app.schemas.common import CodeStr, NameStr, TimestampedModel, ensure_name, ensure_upper_code


class DepartmentCreate(BaseModel):
    name: Annotated[str, NameStr]
    code: Annotated[str, CodeStr]

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Computer Science",
                "code": "CS",
            }
        }
    }

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return ensure_name(value, field_name="Department name")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return ensure_upper_code(value, field_name="Department code")


class DepartmentUpdate(BaseModel):
    name: Annotated[str, NameStr] | None = None
    code: Annotated[str, CodeStr] | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Computer Sciences",
                "code": "CSE",
            }
        }
    }

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_name(value, field_name="Department name")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_upper_code(value, field_name="Department code")


class DepartmentRead(TimestampedModel):
    name: str
    code: str
