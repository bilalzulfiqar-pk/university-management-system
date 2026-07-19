import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, Search, Trash2, UserPlus, Users } from "lucide-react";

import { listDepartments } from "@/features/departments/api";
import { archiveStudent, hardDeleteStudent, listStudents, restoreStudent } from "@/features/students/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { ListPanel } from "@/components/common/list-panel";
import { StatusPill } from "@/components/common/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatDate, fullName } from "@/lib/utils/format";
import type { StudentRead } from "@/lib/api/types";

const STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active only" },
  { value: "ARCHIVED", label: "Archived only" },
  { value: "ALL", label: "All records" },
] as const;

export function StudentListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [semester, setSemester] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [dialogState, setDialogState] = useState<
    { mode: "archive" | "hard-delete" | "restore"; student: StudentRead } | null
  >(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const studentsQuery = useQuery({
    queryKey: ["students", appliedSearch, departmentId, semester, statusFilter, offset],
    queryFn: () =>
      listStudents({
        search: appliedSearch,
        department_id: departmentId,
        semester,
        include_deleted: statusFilter !== "ACTIVE",
        limit: 10,
        offset,
      }),
  });

  const departmentsById = useMemo(
    () => new Map((departmentsQuery.data?.items ?? []).map((department) => [department.id, department.name])),
    [departmentsQuery.data],
  );

  const archiveMutation = useMutation({
    mutationFn: archiveStudent,
    onSuccess: (result) => {
      toast.success(result.message);
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Student archive failed."),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreStudent,
    onSuccess: () => {
      toast.success("Student restored successfully.");
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Student restore failed."),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: hardDeleteStudent,
    onSuccess: (result) => {
      toast.success(result.message);
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Student hard delete failed."),
  });

  const visibleStudents =
    statusFilter === "ARCHIVED"
      ? studentsQuery.data?.items.filter((student) => Boolean(student.deleted_at)) ?? []
      : statusFilter === "ALL"
        ? studentsQuery.data?.items ?? []
        : studentsQuery.data?.items.filter((student) => !student.deleted_at) ?? [];

  const hasFilters = Boolean(appliedSearch) || departmentId !== undefined || semester !== undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Students"
        description="Create, update, archive, and restore student records while keeping account access aligned with backend rules."
        actions={
          <Button asChild>
            <Link to="/admin/students/new">
              <UserPlus className="h-4 w-4" />
              Add student
            </Link>
          </Button>
        }
      />

      <ListPanel
        filters={
          <form
            className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setAppliedSearch(search.trim());
            }}
          >
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or roll number"
              leadingIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={departmentId ? String(departmentId) : ""}
              onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : undefined)}
            >
              <option value="">All departments</option>
              {departmentsQuery.data?.items.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <Select
              value={semester ? String(semester) : ""}
              onChange={(event) => setSemester(event.target.value ? Number(event.target.value) : undefined)}
            >
              <option value="">All semesters</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  Semester {value}
                </option>
              ))}
            </Select>
            <Button variant="secondary" type="submit">
              Apply filters
            </Button>
          </form>
        }
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900">Record visibility</p>
              <p className="text-sm text-slate-500">
                Switch to archived students to access restore or hard-delete actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setAppliedSearch("");
                    setDepartmentId(undefined);
                    setSemester(undefined);
                    setOffset(0);
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
              <Select
                className="lg:max-w-[220px]"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as (typeof STATUS_FILTERS)[number]["value"])
                }
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        }
      >
        {studentsQuery.isLoading || departmentsQuery.isLoading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : studentsQuery.isError || !studentsQuery.data ? (
          <ErrorState description="Students could not be loaded." onRetry={() => studentsQuery.refetch()} />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived students match the current filters."
                : "Try widening your filters or create the first student record for this workspace."
            }
            icon={<Users className="h-5 w-5" />}
            action={
              <Button asChild size="sm">
                <Link to="/admin/students/new">Add student</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Roll number</Th>
                    <Th>Email</Th>
                    <Th>Department</Th>
                    <Th>Semester</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleStudents.map((student) => {
                    const name = fullName(student.first_name, student.last_name);
                    const actions: RowAction[] = student.deleted_at
                      ? [
                          {
                            label: "Restore",
                            icon: <ArchiveRestore />,
                            onSelect: () => setDialogState({ mode: "restore", student }),
                          },
                          {
                            label: "Hard delete",
                            icon: <Trash2 />,
                            destructive: true,
                            onSelect: () => setDialogState({ mode: "hard-delete", student }),
                          },
                        ]
                      : [
                          {
                            label: "Archive",
                            icon: <Archive />,
                            destructive: true,
                            onSelect: () => setDialogState({ mode: "archive", student }),
                          },
                        ];

                    return (
                      <TableRow key={student.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={name} seed={student.email} size="sm" />
                            <span className="font-semibold text-ink-900">{name}</span>
                          </div>
                        </Td>
                        <Td className="tabular font-mono text-xs">{student.roll_number}</Td>
                        <Td className="text-slate-500">{student.email}</Td>
                        <Td>{departmentsById.get(student.department_id) ?? `Department #${student.department_id}`}</Td>
                        <Td className="tabular">{student.current_semester}</Td>
                        <Td>
                          <StatusPill archived={Boolean(student.deleted_at)} active={student.is_active} />
                        </Td>
                        <Td className="text-slate-500">{formatDate(student.updated_at)}</Td>
                        <Td align="right">
                          <RowActions
                            actions={actions}
                            primaryAction={
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/students/${student.id}/edit`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Link>
                              </Button>
                            }
                          />
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              total={studentsQuery.data.total}
              limit={studentsQuery.data.limit}
              offset={studentsQuery.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>

      <Dialog
        open={Boolean(dialogState)}
        title={
          dialogState?.mode === "archive"
            ? "Archive student?"
            : dialogState?.mode === "restore"
              ? "Restore student?"
              : "Permanently delete student?"
        }
        description={
          dialogState?.mode === "archive"
            ? "This disables login and removes the record from standard lists until it is restored."
            : dialogState?.mode === "restore"
              ? "This will reactivate the student profile and linked account."
              : "This permanently removes the student profile and linked user if backend dependency rules allow it."
        }
        confirmLabel={
          dialogState?.mode === "archive" ? "Archive" : dialogState?.mode === "restore" ? "Restore" : "Delete forever"
        }
        destructive={dialogState?.mode !== "restore"}
        pending={archiveMutation.isPending || restoreMutation.isPending || hardDeleteMutation.isPending}
        onClose={() => setDialogState(null)}
        onConfirm={() => {
          if (!dialogState) return;
          if (dialogState.mode === "archive") archiveMutation.mutate(dialogState.student.id);
          if (dialogState.mode === "restore") restoreMutation.mutate(dialogState.student.id);
          if (dialogState.mode === "hard-delete") hardDeleteMutation.mutate(dialogState.student.id);
        }}
      />
    </div>
  );
}
