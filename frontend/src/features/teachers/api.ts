import { apiFetch } from "@/lib/api/client";
import type { MessageResponse, Page, TeacherPayload, TeacherRead } from "@/lib/api/types";

export function listTeachers(params: {
  search?: string;
  department_id?: number;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<TeacherRead>>("/api/v1/admin/teachers", {}, params);
}

export function getTeacher(id: number, includeDeleted = false) {
  return apiFetch<TeacherRead>(`/api/v1/admin/teachers/${id}`, {}, { include_deleted: includeDeleted });
}

export function createTeacher(payload: TeacherPayload) {
  return apiFetch<TeacherRead>("/api/v1/admin/teachers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTeacher(id: number, payload: Partial<TeacherPayload>) {
  return apiFetch<TeacherRead>(`/api/v1/admin/teachers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveTeacher(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/teachers/${id}`, { method: "DELETE" });
}

export function restoreTeacher(id: number) {
  return apiFetch<TeacherRead>(`/api/v1/admin/teachers/${id}/restore`, { method: "POST" });
}

export function hardDeleteTeacher(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/teachers/${id}/hard`, { method: "DELETE" });
}
