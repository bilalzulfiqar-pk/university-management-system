import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { archiveStudent, hardDeleteStudent, listStudents, restoreStudent } from "@/features/students/api";
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
import type { StudentRead } from "@/lib/api/types";

export function StudentListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [semester, setSemester] = useState<number | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dialogState, setDialogState] = useState<{ mode: "archive" | "hard-delete" | "restore"; student: StudentRead } | null>(
    null,
  );

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const studentsQuery = useQuery({
    queryKey: ["students", appliedSearch, departmentId, semester, includeDeleted, offset],
    queryFn: () =>
      listStudents({
        search: appliedSearch,
        department_id: departmentId,
        semester,
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

  if (studentsQuery.isLoading || departmentsQuery.isLoading) return <LoadingScreen label="Loading students..." />;
  if (studentsQuery.isError || !studentsQuery.data) return <ErrorState description="Students could not be loaded." onRetry={() => studentsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Students"
        description="Create, update, archive, and restore student records while keeping account access aligned with backend rules."
        actions={
          <Button asChild>
            <Link to="/admin/students/new">Add student</Link>
          </Button>
        }
      />

      <Card className="space-y-4">
        <form
          className="grid gap-3 xl:grid-cols-[2fr_1fr_1fr_auto] xl:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setAppliedSearch(search.trim());
          }}
        >
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or roll number" />
          <Select value={departmentId ? String(departmentId) : ""} onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">All departments</option>
            {departmentsQuery.data?.items.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Select value={semester ? String(semester) : ""} onChange={(event) => setSemester(event.target.value ? Number(event.target.value) : undefined)}>
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

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
          Include archived students
        </label>

        {studentsQuery.data.items.length === 0 ? (
          <EmptyState title="No students found" description="Try widening your filters or create the first student record for this workspace." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-slate-200">
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
                    <Th className="text-right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {studentsQuery.data.items.map((student) => (
                    <tr key={student.id}>
                      <Td className="font-semibold">{fullName(student.first_name, student.last_name)}</Td>
                      <Td>{student.roll_number}</Td>
                      <Td>{student.email}</Td>
                      <Td>{departmentsById.get(student.department_id) ?? `Department #${student.department_id}`}</Td>
                      <Td>{student.current_semester}</Td>
                      <Td>
                        <StatusPill archived={Boolean(student.deleted_at)} active={student.is_active} />
                      </Td>
                      <Td>{formatDate(student.updated_at)}</Td>
                      <Td className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/students/${student.id}/edit`}>Edit</Link>
                          </Button>
                          {student.deleted_at ? (
                            <>
                              <Button size="sm" onClick={() => setDialogState({ mode: "restore", student })}>
                                Restore
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => setDialogState({ mode: "hard-delete", student })}>
                                Hard delete
                              </Button>
                            </>
                          ) : (
                            <Button variant="danger" size="sm" onClick={() => setDialogState({ mode: "archive", student })}>
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

            <PaginationControls total={studentsQuery.data.total} limit={studentsQuery.data.limit} offset={studentsQuery.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>

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
