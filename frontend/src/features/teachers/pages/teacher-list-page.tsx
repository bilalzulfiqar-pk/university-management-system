import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, Search, ShieldUser, Trash2 } from "lucide-react";

import { listDepartments } from "@/features/departments/api";
import { archiveTeacher, hardDeleteTeacher, listTeachers, restoreTeacher } from "@/features/teachers/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { ListPanel } from "@/components/common/list-panel";
import { MobileRecordCard } from "@/components/common/mobile-record-card";
import { StatusPill } from "@/components/common/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatDate, fullName } from "@/lib/utils/format";
import type { TeacherRead } from "@/lib/api/types";

const STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active only" },
  { value: "ARCHIVED", label: "Archived only" },
  { value: "ALL", label: "All records" },
] as const;

export function TeacherListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [dialogState, setDialogState] = useState<
    { mode: "archive" | "hard-delete" | "restore"; teacher: TeacherRead } | null
  >(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers", appliedSearch, departmentId, statusFilter, offset],
    queryFn: () =>
      listTeachers({
        search: appliedSearch,
        department_id: departmentId,
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
    mutationFn: archiveTeacher,
    onSuccess: (result) => {
      toast.success(result.message);
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Teacher archive failed."),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreTeacher,
    onSuccess: () => {
      toast.success("Teacher restored successfully.");
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Teacher restore failed."),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: hardDeleteTeacher,
    onSuccess: (result) => {
      toast.success(result.message);
      setDialogState(null);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Teacher hard delete failed."),
  });

  const visibleTeachers =
    statusFilter === "ARCHIVED"
      ? teachersQuery.data?.items.filter((teacher) => Boolean(teacher.deleted_at)) ?? []
      : statusFilter === "ALL"
        ? teachersQuery.data?.items ?? []
        : teachersQuery.data?.items.filter((teacher) => !teacher.deleted_at) ?? [];

  const hasFilters = Boolean(appliedSearch) || departmentId !== undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Teachers"
        description="Provision teacher accounts, keep departments aligned, and manage archive or restore flows safely."
        actions={
          <Button asChild>
            <Link to="/admin/teachers/new">
              <ShieldUser className="h-4 w-4" />
              Add teacher
            </Link>
          </Button>
        }
      />

      <ListPanel
        filters={
          <form
            className="grid gap-3 lg:grid-cols-[2fr_1fr_auto] lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setAppliedSearch(search.trim());
            }}
          >
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or employee ID"
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
                Archived teachers stay manageable here so restore and hard-delete actions are easy to find.
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
        {teachersQuery.isLoading || departmentsQuery.isLoading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : teachersQuery.isError || !teachersQuery.data ? (
          <ErrorState description="Teachers could not be loaded." onRetry={() => teachersQuery.refetch()} />
        ) : visibleTeachers.length === 0 ? (
          <EmptyState
            title="No teachers found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived teachers match the current filters."
                : "Create the first teacher account or widen the current filters."
            }
            icon={<ShieldUser className="h-5 w-5" />}
            action={
              <Button asChild size="sm">
                <Link to="/admin/teachers/new">Add teacher</Link>
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Employee ID</Th>
                    <Th>Email</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleTeachers.map((teacher) => {
                    const name = fullName(teacher.first_name, teacher.last_name);
                    const actions: RowAction[] = teacher.deleted_at
                      ? [
                          {
                            label: "Restore",
                            icon: <ArchiveRestore />,
                            onSelect: () => setDialogState({ mode: "restore", teacher }),
                          },
                          {
                            label: "Hard delete",
                            icon: <Trash2 />,
                            destructive: true,
                            onSelect: () => setDialogState({ mode: "hard-delete", teacher }),
                          },
                        ]
                      : [
                          {
                            label: "Archive",
                            icon: <Archive />,
                            destructive: true,
                            onSelect: () => setDialogState({ mode: "archive", teacher }),
                          },
                        ];

                    return (
                      <TableRow key={teacher.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={name} seed={teacher.email} size="sm" />
                            <span className="font-semibold text-ink-900">{name}</span>
                          </div>
                        </Td>
                        <Td className="tabular font-mono text-xs">{teacher.employee_id}</Td>
                        <Td className="text-slate-500">{teacher.email}</Td>
                        <Td>{departmentsById.get(teacher.department_id) ?? `Department #${teacher.department_id}`}</Td>
                        <Td>
                          <StatusPill archived={Boolean(teacher.deleted_at)} active={teacher.is_active} />
                        </Td>
                        <Td className="text-slate-500">{formatDate(teacher.updated_at)}</Td>
                        <Td align="right">
                          <RowActions
                            actions={actions}
                            primaryAction={
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/teachers/${teacher.id}/edit`}>
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

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {visibleTeachers.map((teacher) => {
                const name = fullName(teacher.first_name, teacher.last_name);
                const actions: RowAction[] = teacher.deleted_at
                  ? [
                      {
                        label: "Restore",
                        icon: <ArchiveRestore />,
                        onSelect: () => setDialogState({ mode: "restore", teacher }),
                      },
                      {
                        label: "Hard delete",
                        icon: <Trash2 />,
                        destructive: true,
                        onSelect: () => setDialogState({ mode: "hard-delete", teacher }),
                      },
                    ]
                  : [
                      {
                        label: "Archive",
                        icon: <Archive />,
                        destructive: true,
                        onSelect: () => setDialogState({ mode: "archive", teacher }),
                      },
                    ];

                return (
                  <MobileRecordCard
                    key={teacher.id}
                    title={name}
                    avatar={<Avatar name={name} seed={teacher.email} size="sm" />}
                    subtitle={teacher.email}
                    badges={<StatusPill archived={Boolean(teacher.deleted_at)} active={teacher.is_active} />}
                    fields={[
                      { label: "Employee ID", value: <span className="font-mono text-xs">{teacher.employee_id}</span> },
                      {
                        label: "Department",
                        value:
                          departmentsById.get(teacher.department_id) ?? `#${teacher.department_id}`,
                      },
                      { label: "Updated", value: formatDate(teacher.updated_at) },
                    ]}
                    actions={
                      <RowActions
                        actions={actions}
                        primaryAction={
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Edit teacher">
                            <Link to={`/admin/teachers/${teacher.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        }
                      />
                    }
                  />
                );
              })}
            </div>

            <PaginationControls
              total={teachersQuery.data.total}
              limit={teachersQuery.data.limit}
              offset={teachersQuery.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>

      <Dialog
        open={Boolean(dialogState)}
        title={
          dialogState?.mode === "archive"
            ? "Archive teacher?"
            : dialogState?.mode === "restore"
              ? "Restore teacher?"
              : "Permanently delete teacher?"
        }
        description={
          dialogState?.mode === "archive"
            ? "This disables login and hides the teacher from standard lists."
            : dialogState?.mode === "restore"
              ? "This restores the teacher profile and linked account."
              : "This permanently removes the teacher profile and linked user if no backend blockers remain."
        }
        confirmLabel={
          dialogState?.mode === "restore" ? "Restore" : dialogState?.mode === "hard-delete" ? "Delete forever" : "Archive"
        }
        destructive={dialogState?.mode !== "restore"}
        pending={archiveMutation.isPending || restoreMutation.isPending || hardDeleteMutation.isPending}
        onClose={() => setDialogState(null)}
        onConfirm={() => {
          if (!dialogState) return;
          if (dialogState.mode === "archive") archiveMutation.mutate(dialogState.teacher.id);
          if (dialogState.mode === "restore") restoreMutation.mutate(dialogState.teacher.id);
          if (dialogState.mode === "hard-delete") hardDeleteMutation.mutate(dialogState.teacher.id);
        }}
      />
    </div>
  );
}
