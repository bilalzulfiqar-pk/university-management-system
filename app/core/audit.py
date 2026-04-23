from dataclasses import dataclass

from fastapi import Request


@dataclass
class AuditContext:
    action: str
    entity_type: str
    entity_id: int | None
    entity_label: str | None
    description: str


def set_audit_context(
    request: Request,
    *,
    action: str,
    entity_type: str,
    entity_id: int | None,
    entity_label: str | None,
    description: str,
) -> None:
    request.state.audit_context = AuditContext(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_label=entity_label,
        description=description,
    )
