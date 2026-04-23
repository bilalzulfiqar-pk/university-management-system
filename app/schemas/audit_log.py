from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int | None
    actor_role: str | None
    action: str
    entity_type: str
    entity_id: int | None
    entity_label: str | None
    description: str
    method: str
    path: str
    status_code: int
    request_id: str | None
    client_ip: str | None
    created_at: datetime
