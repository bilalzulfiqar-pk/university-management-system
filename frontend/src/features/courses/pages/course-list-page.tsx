import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, BookOpen, Pencil, Plus, Search } from "lucide-react";

import { listDepartments } from "@/features/departments/api";
import { archiveCourse, listCourses } from "@/features/courses/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { ListPanel } from "@/components/common/list-panel";
import { MobileRecordCard } from "@/components/common/mobile-record-card";
import { StatusPill } from "@/components/common/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";

const STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active only" },
  { value: "ARCHIVED", label: "Archived only" },
  { value: "ALL", label: "All records" },
] as const;

export function CourseListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ACTIVE");
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

  const visibleCourses =
    statusFilter === "ARCHIVED"
      ? coursesQuery.data?.items.filter((course) => Boolean(course.deleted_at)) ?? []
      : statusFilter === "ALL"
        ? coursesQuery.data?.items ?? []
        : coursesQuery.data?.items.filter((course) => !course.deleted_at) ?? [];

  const selectedCourse = coursesQuery.data?.items.find((course) => course.id === selectedId) ?? null;
  const hasFilters = Boolean(appliedSearch || departmentId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Courses"
        description="Keep the course catalogue tidy before turning those entries into course offerings."
        actions={
          <Button asChild>
            <Link to="/admin/courses/new">
              <Plus className="h-4 w-4" />
              Add course
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
              placeholder="Search by course code or title"
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-ink-900">Record visibility</p>
              <p className="text-sm text-slate-500">
                Switch to archived courses to access restore or hard-delete actions.
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
                className="sm:max-w-[220px]"
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
        {coursesQuery.isLoading || departmentsQuery.isLoading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : coursesQuery.isError || !coursesQuery.data ? (
          <ErrorState description="Courses could not be loaded." onRetry={() => coursesQuery.refetch()} />
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            title="No courses found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived courses match the current filters."
                : "Create a course to start building real term-based offerings."
            }
            icon={<BookOpen className="h-5 w-5" />}
            action={
              <Button asChild size="sm">
                <Link to="/admin/courses/new">Add course</Link>
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
                    <Th>Code</Th>
                    <Th>Title</Th>
                    <Th>Credit hours</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleCourses.map((course) => {
                    const actions: RowAction[] = course.deleted_at
                      ? []
                      : [
                          {
                            label: "Archive",
                            icon: <Archive />,
                            destructive: true,
                            onSelect: () => setSelectedId(course.id),
                          },
                        ];

                    return (
                      <TableRow key={course.id}>
                        <Td>
                          <Badge variant="ink" className="font-mono">
                            {course.code}
                          </Badge>
                        </Td>
                        <Td className="font-semibold text-ink-900">{course.name}</Td>
                        <Td className="tabular">{course.credit_hours}</Td>
                        <Td>{departmentsById.get(course.department_id) ?? `Department #${course.department_id}`}</Td>
                        <Td>
                          <StatusPill archived={Boolean(course.deleted_at)} />
                        </Td>
                        <Td className="text-slate-500">{formatDate(course.updated_at)}</Td>
                        <Td align="right">
                          <RowActions
                            actions={actions}
                            primaryAction={
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/admin/courses/${course.id}/edit`}>
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
              {visibleCourses.map((course) => {
                const actions: RowAction[] = course.deleted_at
                  ? []
                  : [
                      {
                        label: "Archive",
                        icon: <Archive />,
                        destructive: true,
                        onSelect: () => setSelectedId(course.id),
                      },
                    ];

                return (
                  <MobileRecordCard
                    key={course.id}
                    title={course.name}
                    subtitle={
                      <Badge variant="ink" className="font-mono">
                        {course.code}
                      </Badge>
                    }
                    badges={<StatusPill archived={Boolean(course.deleted_at)} />}
                    fields={[
                      { label: "Credit hours", value: course.credit_hours },
                      {
                        label: "Department",
                        value:
                          departmentsById.get(course.department_id) ?? `#${course.department_id}`,
                      },
                      { label: "Updated", value: formatDate(course.updated_at) },
                    ]}
                    actions={
                      <RowActions
                        actions={actions}
                        primaryAction={
                          <Button variant="ghost" size="icon-sm" asChild aria-label="Edit course">
                            <Link to={`/admin/courses/${course.id}/edit`}>
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
              total={coursesQuery.data.total}
              limit={coursesQuery.data.limit}
              offset={coursesQuery.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>

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
