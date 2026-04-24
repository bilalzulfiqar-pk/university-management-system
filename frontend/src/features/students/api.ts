import { apiFetch } from "@/lib/api/client";
import type { MessageResponse, Page, StudentPayload, StudentRead } from "@/lib/api/types";

export function listStudents(params: {
  search?: string;
  department_id?: number;
  semester?: number;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<StudentRead>>("/api/v1/admin/students", {}, params);
}

export function getStudent(id: number, includeDeleted = false) {
  return apiFetch<StudentRead>(`/api/v1/admin/students/${id}`, {}, { include_deleted: includeDeleted });
}

export function createStudent(payload: StudentPayload) {
  return apiFetch<StudentRead>("/api/v1/admin/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(id: number, payload: Partial<StudentPayload>) {
  return apiFetch<StudentRead>(`/api/v1/admin/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveStudent(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/students/${id}`, { method: "DELETE" });
}

export function restoreStudent(id: number) {
  return apiFetch<StudentRead>(`/api/v1/admin/students/${id}/restore`, { method: "POST" });
}

export function hardDeleteStudent(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/students/${id}/hard`, { method: "DELETE" });
}
