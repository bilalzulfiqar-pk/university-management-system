from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


DEFAULT_SECRET_KEY = "change-me-to-a-long-random-secret-key-at-least-32-chars"  # nosec B105
DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"  # nosec B105


class Settings(BaseSettings):
    app_name: str = "University Management System"
    environment: str = "development"
    debug: bool = False
    show_docs: bool = True
    secret_key: str = DEFAULT_SECRET_KEY
    jwt_issuer: str = "ums-api"
    jwt_audience: str = "ums-spa"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/university_management"
    admin_email: str = "admin@example.com"
    admin_password: str = DEFAULT_ADMIN_PASSWORD
    log_level: str = "INFO"
    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    trusted_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    redis_url: str | None = None

    access_cookie_name: str = "ums_access"
    refresh_cookie_name: str = "ums_refresh"
    csrf_cookie_name: str = "ums_csrf"
    cookie_domain: str | None = None
    cookie_path: str = "/"
    cookie_same_site: str = "lax"
    cookie_secure: bool = False

    login_rate_limit_attempts: int = 5
    login_rate_limit_window_seconds: int = 60
    login_ip_rate_limit_attempts: int = 20
    login_ip_rate_limit_window_seconds: int = 60
    api_read_rate_limit_attempts: int = 300
    api_read_rate_limit_window_seconds: int = 60
    api_write_rate_limit_attempts: int = 60
    api_write_rate_limit_window_seconds: int = 60
    change_password_rate_limit_attempts: int = 5
    change_password_rate_limit_window_seconds: int = 300
    refresh_rate_limit_attempts: int = 10
    refresh_rate_limit_window_seconds: int = 300
    csrf_failure_rate_limit_attempts: int = 20
    csrf_failure_rate_limit_window_seconds: int = 300

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @field_validator("cors_origins", "trusted_origins", mode="before")
    @classmethod
    def parse_origin_lists(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
        return value

    @field_validator("cookie_same_site")
    @classmethod
    def validate_cookie_same_site(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("COOKIE_SAME_SITE must be one of: lax, strict, none.")
        return normalized

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_runtime_security(self) -> None:
        if not self.is_production:
            return

        problems: list[str] = []
        if self.secret_key == DEFAULT_SECRET_KEY:
            problems.append("SECRET_KEY must be changed from the placeholder value.")
        if self.admin_password == DEFAULT_ADMIN_PASSWORD:
            problems.append("ADMIN_PASSWORD must be changed from the default value.")
        if self.debug:
            problems.append("DEBUG must be false in production.")
        if self.show_docs:
            problems.append("SHOW_DOCS must be false in production.")
        if not self.cors_origins:
            problems.append("CORS_ORIGINS must be configured in production.")
        if not self.trusted_origins:
            problems.append("TRUSTED_ORIGINS must be configured in production.")
        if not self.redis_url:
            problems.append("REDIS_URL must be configured in production.")
        if not self.cookie_secure:
            problems.append("COOKIE_SECURE must be true in production.")
        if self.cookie_same_site == "none" and not self.cookie_secure:
            problems.append("COOKIE_SECURE must be true when COOKIE_SAME_SITE is none.")

        if problems:
            raise RuntimeError("Unsafe production security configuration: " + " ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
