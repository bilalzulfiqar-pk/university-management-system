from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import CodeStr, NameStr, TimestampedModel, ensure_name, ensure_upper_code


class CourseCreate(BaseModel):
    name: Annotated[str, NameStr]
    code: Annotated[str, CodeStr]
    credit_hours: int = Field(gt=0)
    department_id: int = Field(gt=0)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return ensure_name(value, field_name="Course name")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return ensure_upper_code(value, field_name="Course code")


class CourseUpdate(BaseModel):
    name: Annotated[str, NameStr] | None = None
    code: Annotated[str, CodeStr] | None = None
    credit_hours: int | None = Field(default=None, gt=0)
    department_id: int | None = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_name(value, field_name="Course name")

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_upper_code(value, field_name="Course code")


class CourseRead(TimestampedModel):
    name: str
    code: str
    credit_hours: int
    department_id: int

