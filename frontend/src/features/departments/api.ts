import { apiFetch } from "@/lib/api/client";
import type { DepartmentPayload, DepartmentRead, MessageResponse, Page } from "@/lib/api/types";

export function listDepartments(params: {
  search?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<DepartmentRead>>("/api/v1/admin/departments", {}, params);
}

export function getDepartment(id: number, includeDeleted = false) {
  return apiFetch<DepartmentRead>(`/api/v1/admin/departments/${id}`, {}, { include_deleted: includeDeleted });
}

export function createDepartment(payload: DepartmentPayload) {
  return apiFetch<DepartmentRead>("/api/v1/admin/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDepartment(id: number, payload: Partial<DepartmentPayload>) {
  return apiFetch<DepartmentRead>(`/api/v1/admin/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveDepartment(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/departments/${id}`, { method: "DELETE" });
}
