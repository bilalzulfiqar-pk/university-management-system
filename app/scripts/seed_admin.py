from app.core.config import settings
from app.db.base import Base  # noqa: F401
from app.db.session import SessionLocal
from app.services.auth import create_admin_user


def main() -> None:
    db = SessionLocal()
    try:
        user = create_admin_user(
            db=db,
            email=settings.admin_email,
            password=settings.admin_password,
        )
        print(f"Admin user ready: {user.email}")
    finally:
        db.close()
