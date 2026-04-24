import { apiFetch } from "@/lib/api/client";
import type { CourseOfferingPayload, CourseOfferingRead, MessageResponse, Page } from "@/lib/api/types";

export function listOfferings(params: {
  search?: string;
  course_id?: number;
  term?: string;
  year?: number;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  return apiFetch<Page<CourseOfferingRead>>("/api/v1/admin/course-offerings", {}, params);
}

export function getOffering(id: number, includeDeleted = false) {
  return apiFetch<CourseOfferingRead>(`/api/v1/admin/course-offerings/${id}`, {}, { include_deleted: includeDeleted });
}

export function createOffering(payload: CourseOfferingPayload) {
  return apiFetch<CourseOfferingRead>("/api/v1/admin/course-offerings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOffering(id: number, payload: Partial<CourseOfferingPayload>) {
  return apiFetch<CourseOfferingRead>(`/api/v1/admin/course-offerings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveOffering(id: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/course-offerings/${id}`, { method: "DELETE" });
}

export function assignTeacher(offeringId: number, teacherId: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/course-offerings/${offeringId}/teachers/${teacherId}`, {
    method: "POST",
  });
}

export function unassignTeacher(offeringId: number, teacherId: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/course-offerings/${offeringId}/teachers/${teacherId}`, {
    method: "DELETE",
  });
}

export function enrollStudent(offeringId: number, studentId: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/course-offerings/${offeringId}/students/${studentId}`, {
    method: "POST",
  });
}

export function unenrollStudent(offeringId: number, studentId: number) {
  return apiFetch<MessageResponse>(`/api/v1/admin/course-offerings/${offeringId}/students/${studentId}`, {
    method: "DELETE",
  });
}
