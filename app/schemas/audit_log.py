from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminAuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_user_id: int | None
    actor_role: str | None
    method: str
    path: str
    status_code: int
    request_id: str | None
    client_ip: str | None
    created_at: datetime
