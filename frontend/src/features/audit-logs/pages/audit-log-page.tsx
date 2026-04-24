import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAuditLogs } from "@/features/audit-logs/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils/format";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "CREATE_DEPARTMENT", label: "Create department" },
  { value: "UPDATE_DEPARTMENT", label: "Update department" },
  { value: "SOFT_DELETE_DEPARTMENT", label: "Archive department" },
  { value: "CREATE_STUDENT", label: "Create student" },
  { value: "UPDATE_STUDENT", label: "Update student" },
  { value: "SOFT_DELETE_STUDENT", label: "Archive student" },
  { value: "RESTORE_STUDENT", label: "Restore student" },
  { value: "HARD_DELETE_STUDENT", label: "Hard delete student" },
  { value: "CREATE_TEACHER", label: "Create teacher" },
  { value: "UPDATE_TEACHER", label: "Update teacher" },
  { value: "SOFT_DELETE_TEACHER", label: "Archive teacher" },
  { value: "RESTORE_TEACHER", label: "Restore teacher" },
  { value: "HARD_DELETE_TEACHER", label: "Hard delete teacher" },
  { value: "CREATE_COURSE", label: "Create course" },
  { value: "UPDATE_COURSE", label: "Update course" },
  { value: "SOFT_DELETE_COURSE", label: "Archive course" },
  { value: "CREATE_COURSE_OFFERING", label: "Create offering" },
  { value: "UPDATE_COURSE_OFFERING", label: "Update offering" },
  { value: "SOFT_DELETE_COURSE_OFFERING", label: "Archive offering" },
  { value: "ASSIGN_TEACHER", label: "Assign teacher" },
  { value: "UNASSIGN_TEACHER", label: "Unassign teacher" },
  { value: "ENROLL_STUDENT", label: "Enroll student" },
  { value: "UNENROLL_STUDENT", label: "Unenroll student" },
] as const;

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All entity types" },
  { value: "department", label: "Department" },
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "course", label: "Course" },
  { value: "course_offering", label: "Course offering" },
] as const;

const METHOD_OPTIONS = [
  { value: "", label: "All methods" },
  { value: "POST", label: "POST" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
] as const;

export function AuditLogPage() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [method, setMethod] = useState("");
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: ["audit-logs", action, entityType, method, offset],
    queryFn: () =>
      listAuditLogs({
        action: action || undefined,
        entity_type: entityType || undefined,
        method: method || undefined,
        limit: 10,
        offset,
      }),
  });

  if (query.isLoading) return <LoadingScreen label="Loading audit history..." />;
  if (query.isError || !query.data) {
    return <ErrorState description="Audit history could not be loaded." onRetry={() => query.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin audit history"
        title="Audit Logs"
        description="Review admin actions by filtering readable backend-generated entries instead of raw request paths."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setOffset(0);
            }}
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value || "all-actions"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setOffset(0);
            }}
          >
            {ENTITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "all-entities"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setOffset(0);
            }}
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option.value || "all-methods"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {query.data.items.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="Try a broader filter or perform an admin action to generate a new audit entry."
          />
        ) : (
          <>
            <div className="space-y-4">
              {query.data.items.map((entry) => (
                <div key={entry.id} className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-ink-950">{entry.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <span>{entry.action.replaceAll("_", " ")}</span>
                        <span>|</span>
                        <span>{entry.entity_type}</span>
                        <span>|</span>
                        <span>Status {entry.status_code}</span>
                        {entry.entity_label ? (
                          <>
                            <span>|</span>
                            <span>{entry.entity_label}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-700">
                      <p className="font-semibold">{entry.actor_role ?? "System"}</p>
                      <p>{formatDate(entry.created_at)}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{entry.method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              total={query.data.total}
              limit={query.data.limit}
              offset={query.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </Card>
    </div>
  );
}
