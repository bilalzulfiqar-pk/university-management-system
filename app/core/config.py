from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "University Management System"
    environment: str = "development"
    debug: bool = False
    show_docs: bool = True
    secret_key: str = "change-me-to-a-long-random-secret-key-at-least-32-chars"
    access_token_expire_minutes: int = 30
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/university_management"
    admin_email: str = "admin@example.com"
    admin_password: str = "ChangeMe123!"
    log_level: str = "INFO"
    cors_origins: list[str] = Field(default_factory=list)
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long.")
        return value

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
