import { apiFetch } from "@/lib/api/client";
import type { AdminAuditLogRead, Page } from "@/lib/api/types";

export function listAuditLogs(params: {
  actor_user_id?: number;
  method?: string;
  action?: string;
  entity_type?: string;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<AdminAuditLogRead>>("/api/v1/admin/audit-logs", {}, params);
}
