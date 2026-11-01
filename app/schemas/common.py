import re
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


NameStr = StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
CodeStr = StringConstraints(strip_whitespace=True, min_length=2, max_length=20)
IdentifierStr = StringConstraints(strip_whitespace=True, min_length=2, max_length=30)
SectionStr = StringConstraints(strip_whitespace=True, min_length=1, max_length=10)


CODE_PATTERN = re.compile(r"^[A-Z0-9-]+$")
NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z .'-]*$")


def ensure_upper_code(value: str, *, field_name: str) -> str:
    normalized = value.strip().upper()
    if not CODE_PATTERN.fullmatch(normalized):
        raise ValueError(f"{field_name} must contain only uppercase letters, numbers, or hyphens.")
    return normalized


def ensure_identifier(value: str, *, field_name: str) -> str:
    normalized = value.strip().upper()
    if not CODE_PATTERN.fullmatch(normalized):
        raise ValueError(f"{field_name} must contain only uppercase letters, numbers, or hyphens.")
    return normalized


def ensure_name(value: str, *, field_name: str) -> str:
    normalized = value.strip()
    if not NAME_PATTERN.fullmatch(normalized):
        raise ValueError(f"{field_name} contains invalid characters.")
    return normalized


def validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError("Password must contain at least one special character.")
    return value


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    success: bool = True
    message: str


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int = Field(ge=1, le=500)
    offset: int = Field(ge=0)


class TimestampedModel(ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=500)
    offset: int = Field(default=0, ge=0)

