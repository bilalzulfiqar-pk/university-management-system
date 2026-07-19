import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";

import { listAuditLogs } from "@/features/audit-logs/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { ListPanel } from "@/components/common/list-panel";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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

const METHOD_VARIANT: Record<string, "success" | "info" | "warning" | "danger"> = {
  POST: "success",
  PATCH: "info",
  DELETE: "danger",
};

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
        limit: 15,
        offset,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin audit history"
        title="Audit Logs"
        description="Review admin actions by filtering readable backend-generated entries instead of raw request paths."
      />

      <ListPanel
        filters={
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
        }
      >
        {query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError || !query.data ? (
          <ErrorState description="Audit history could not be loaded." onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="Try a broader filter or perform an admin action to generate a new audit entry."
            icon={<Search className="h-5 w-5" />}
          />
        ) : (
          <>
            <ol className="space-y-2">
              {query.data.items.map((entry) => {
                const variant = METHOD_VARIANT[entry.method] ?? "neutral";
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-smooth hover:border-slate-300 lg:flex-row lg:items-start lg:justify-between",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
                        <History className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-medium text-ink-900">{entry.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="neutral">{entry.action.replaceAll("_", " ")}</Badge>
                          <Badge variant={variant}>{entry.method}</Badge>
                          {entry.status_code >= 400 ? (
                            <Badge variant="danger" dot>
                              {entry.status_code}
                            </Badge>
                          ) : (
                            <Badge variant="success" dot>
                              {entry.status_code}
                            </Badge>
                          )}
                          {entry.entity_label ? <Badge variant="ink">{entry.entity_label}</Badge> : null}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-400 lg:text-right">
                      <p className="font-semibold text-ink-700">{entry.actor_role ?? "System"}</p>
                      <p>{relativeTime(entry.created_at)}</p>
                      <p className="tabular font-mono text-[10px]">{formatDate(entry.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <PaginationControls
              total={query.data.total}
              limit={query.data.limit}
              offset={query.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>
    </div>
  );
}
