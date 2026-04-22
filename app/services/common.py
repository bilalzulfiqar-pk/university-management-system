from datetime import datetime, timezone

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.schemas.common import Page


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def paginate(db: Session, stmt: Select, *, limit: int, offset: int):
    total_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total = db.scalar(total_stmt) or 0
    items = list(db.execute(stmt.limit(limit).offset(offset)).scalars().all())
    return total, items


def build_page(*, items: list, total: int, limit: int, offset: int):
    return Page(items=items, total=total, limit=limit, offset=offset)


def commit_or_rollback(db: Session) -> None:
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

