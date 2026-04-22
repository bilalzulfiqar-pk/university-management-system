from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from app.core.constants import AcademicTerm
from app.schemas.common import SectionStr, TimestampedModel, ensure_upper_code


class CourseOfferingCreate(BaseModel):
    course_id: int = Field(gt=0)
    term: AcademicTerm
    year: int = Field(ge=2000, le=2100)
    section: Annotated[str, SectionStr]
    capacity: int | None = Field(default=None, gt=0)

    @field_validator("section")
    @classmethod
    def normalize_section(cls, value: str) -> str:
        return ensure_upper_code(value, field_name="Section")


class CourseOfferingUpdate(BaseModel):
    course_id: int | None = Field(default=None, gt=0)
    term: AcademicTerm | None = None
    year: int | None = Field(default=None, ge=2000, le=2100)
    section: Annotated[str, SectionStr] | None = None
    capacity: int | None = Field(default=None, gt=0)

    @field_validator("section")
    @classmethod
    def normalize_section(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ensure_upper_code(value, field_name="Section")


class CourseOfferingRead(TimestampedModel):
    course_id: int
    course_code: str
    course_name: str
    term: AcademicTerm
    year: int
    section: str
    capacity: int | None = None
    teacher_ids: list[int] = Field(default_factory=list)
    student_count: int = 0

