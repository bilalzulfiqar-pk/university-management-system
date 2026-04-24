import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { listDepartments } from "@/features/departments/api";
import { archiveCourse, listCourses } from "@/features/courses/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { StatusPill } from "@/components/common/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableHead, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";

export function CourseListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ARCHIVED" | "ALL">("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments-options"],
    queryFn: () => listDepartments({ limit: 100, offset: 0 }),
  });

  const coursesQuery = useQuery({
    queryKey: ["courses", appliedSearch, departmentId, statusFilter, offset],
    queryFn: () =>
      listCourses({
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
    mutationFn: archiveCourse,
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Course archive failed."),
  });

  if (coursesQuery.isLoading || departmentsQuery.isLoading) return <LoadingScreen label="Loading courses..." />;
  if (coursesQuery.isError || !coursesQuery.data) return <ErrorState description="Courses could not be loaded." onRetry={() => coursesQuery.refetch()} />;

  const visibleCourses =
    statusFilter === "ARCHIVED"
      ? coursesQuery.data.items.filter((course) => Boolean(course.deleted_at))
      : statusFilter === "ALL"
        ? coursesQuery.data.items
        : coursesQuery.data.items.filter((course) => !course.deleted_at);

  const selectedCourse = coursesQuery.data.items.find((course) => course.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Courses"
        description="Keep the course catalog tidy before turning those catalog entries into course offerings."
        actions={
          <Button asChild>
            <Link to="/admin/courses/new">Add course</Link>
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
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by course code or title" />
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

        <div className="flex flex-col gap-3 rounded-[16px] border border-slate-200 bg-slate-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink-950">Record visibility</p>
            <p className="text-sm text-slate-700">
              Courses are soft-delete only in this MVP. Archived records can be reviewed here, but restore is not available from the backend yet.
            </p>
          </div>
          <Select className="lg:max-w-[220px]" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ACTIVE" | "ARCHIVED" | "ALL")}>
            <option value="ACTIVE">Active only</option>
            <option value="ARCHIVED">Archived only</option>
            <option value="ALL">All records</option>
          </Select>
        </div>

        {visibleCourses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived courses match the current filters."
                : "Create a course to start building real term-based offerings."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Title</Th>
                    <Th>Credit hours</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleCourses.map((course) => (
                    <tr key={course.id}>
                      <Td className="font-semibold">{course.code}</Td>
                      <Td>{course.name}</Td>
                      <Td>{course.credit_hours}</Td>
                      <Td>{departmentsById.get(course.department_id) ?? `Department #${course.department_id}`}</Td>
                      <Td>
                        <StatusPill archived={Boolean(course.deleted_at)} />
                      </Td>
                      <Td>{formatDate(course.updated_at)}</Td>
                      <Td className="min-w-[240px] text-right">
                        <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/courses/${course.id}/edit`}>Edit</Link>
                          </Button>
                          {!course.deleted_at ? (
                            <Button variant="danger" size="sm" onClick={() => setSelectedId(course.id)}>
                              Archive
                            </Button>
                          ) : (
                            <Badge variant="warning">Soft-delete only</Badge>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls total={coursesQuery.data.total} limit={coursesQuery.data.limit} offset={coursesQuery.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedCourse)}
        title="Archive course?"
        description="Archiving hides the course from standard lists and future offering creation flows."
        confirmLabel="Archive course"
        destructive
        pending={archiveMutation.isPending}
        onClose={() => setSelectedId(null)}
        onConfirm={() => {
          if (selectedId) archiveMutation.mutate(selectedId);
        }}
      />
    </div>
  );
}
