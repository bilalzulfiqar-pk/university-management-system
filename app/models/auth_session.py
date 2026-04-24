from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


def generate_session_id() -> str:
    return str(uuid4())


class AuthSession(TimestampMixin, Base):
    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_session_id)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    csrf_secret: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    last_used_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_used_user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user = relationship("User", back_populates="auth_sessions")
