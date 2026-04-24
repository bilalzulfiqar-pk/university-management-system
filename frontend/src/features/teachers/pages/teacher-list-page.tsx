import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { archiveTeacher, hardDeleteTeacher, listTeachers, restoreTeacher } from "@/features/teachers/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { StatusPill } from "@/components/common/status-pill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableHead, Td, Th } from "@/components/ui/table";
import { formatDate, fullName } from "@/lib/utils/format";
import type { TeacherRead } from "@/lib/api/types";

export function TeacherListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dialogState, setDialogState] = useState<{ mode: "archive" | "hard-delete" | "restore"; teacher: TeacherRead } | null>(
    null,
  );

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers", appliedSearch, departmentId, includeDeleted, offset],
    queryFn: () =>
      listTeachers({
        search: appliedSearch,
        department_id: departmentId,
        include_deleted: includeDeleted,
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

  if (teachersQuery.isLoading || departmentsQuery.isLoading) return <LoadingScreen label="Loading teachers..." />;
  if (teachersQuery.isError || !teachersQuery.data) return <ErrorState description="Teachers could not be loaded." onRetry={() => teachersQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Teachers"
        description="Provision teacher accounts, keep departments aligned, and manage archive/restore flows safely."
        actions={
          <Button asChild>
            <Link to="/admin/teachers/new">Add teacher</Link>
          </Button>
        }
      />

      <Card className="space-y-4">
        <form
          className="grid gap-3 xl:grid-cols-[2fr_1fr_auto] xl:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setAppliedSearch(search.trim());
          }}
        >
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or employee ID" />
          <Select value={departmentId ? String(departmentId) : ""} onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : undefined)}>
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

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
          Include archived teachers
        </label>

        {teachersQuery.data.items.length === 0 ? (
          <EmptyState title="No teachers found" description="Create the first teacher account or widen the current filters." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Employee ID</Th>
                    <Th>Email</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {teachersQuery.data.items.map((teacher) => (
                    <tr key={teacher.id}>
                      <Td className="font-semibold">{fullName(teacher.first_name, teacher.last_name)}</Td>
                      <Td>{teacher.employee_id}</Td>
                      <Td>{teacher.email}</Td>
                      <Td>{departmentsById.get(teacher.department_id) ?? `Department #${teacher.department_id}`}</Td>
                      <Td>
                        <StatusPill archived={Boolean(teacher.deleted_at)} active={teacher.is_active} />
                      </Td>
                      <Td>{formatDate(teacher.updated_at)}</Td>
                      <Td className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/teachers/${teacher.id}/edit`}>Edit</Link>
                          </Button>
                          {teacher.deleted_at ? (
                            <>
                              <Button size="sm" onClick={() => setDialogState({ mode: "restore", teacher })}>
                                Restore
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => setDialogState({ mode: "hard-delete", teacher })}>
                                Hard delete
                              </Button>
                            </>
                          ) : (
                            <Button variant="danger" size="sm" onClick={() => setDialogState({ mode: "archive", teacher })}>
                              Archive
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls total={teachersQuery.data.total} limit={teachersQuery.data.limit} offset={teachersQuery.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>

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
        confirmLabel={dialogState?.mode === "restore" ? "Restore" : dialogState?.mode === "hard-delete" ? "Delete forever" : "Archive"}
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
