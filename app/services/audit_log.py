from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.audit_log import AdminAuditLog
from app.schemas.audit_log import AdminAuditLogRead
from app.schemas.common import Page
from app.services.common import build_page, paginate


class AuditLogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        actor_user_id: int | None,
        method: str | None,
        action: str | None,
        entity_type: str | None,
        limit: int,
        offset: int,
    ) -> Page[AdminAuditLogRead]:
        stmt: Select = select(AdminAuditLog).order_by(AdminAuditLog.id.desc())
        if actor_user_id is not None:
            stmt = stmt.where(AdminAuditLog.actor_user_id == actor_user_id)
        if method is not None:
            stmt = stmt.where(AdminAuditLog.method == method.upper())
        if action is not None:
            stmt = stmt.where(AdminAuditLog.action == action.upper())
        if entity_type is not None:
            stmt = stmt.where(AdminAuditLog.entity_type == entity_type.lower())
        total, items = paginate(self.db, stmt, limit=limit, offset=offset)
        return build_page(
            items=[AdminAuditLogRead.model_validate(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )
