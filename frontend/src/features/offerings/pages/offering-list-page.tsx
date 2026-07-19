import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, BookOpen, Pencil, Plus, Search } from "lucide-react";

import { listCourses } from "@/features/courses/api";
import { archiveOffering, listOfferings } from "@/features/offerings/api";
import { academicTerms } from "@/lib/constants/options";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PaginationControls } from "@/components/common/pagination-controls";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { ListPanel } from "@/components/common/list-panel";
import { StatusPill } from "@/components/common/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatDate, formatTerm } from "@/lib/utils/format";

const STATUS_FILTERS = [
  { value: "ACTIVE", label: "Active only" },
  { value: "ARCHIVED", label: "Archived only" },
  { value: "ALL", label: "All records" },
] as const;

export function OfferingListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [courseId, setCourseId] = useState<number | undefined>();
  const [term, setTerm] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("ACTIVE");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => listCourses({ limit: 100, offset: 0 }),
  });

  const offeringsQuery = useQuery({
    queryKey: ["offerings", appliedSearch, courseId, term, year, statusFilter, offset],
    queryFn: () =>
      listOfferings({
        search: appliedSearch,
        course_id: courseId,
        term,
        year,
        include_deleted: statusFilter !== "ACTIVE",
        limit: 10,
        offset,
      }),
  });

  const coursesById = useMemo(
    () => new Map((coursesQuery.data?.items ?? []).map((course) => [course.id, `${course.code} · ${course.name}`])),
    [coursesQuery.data],
  );

  const archiveMutation = useMutation({
    mutationFn: archiveOffering,
    onSuccess: (result) => {
      toast.success(result.message);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Offering archive failed."),
  });

  const visibleOfferings =
    statusFilter === "ARCHIVED"
      ? offeringsQuery.data?.items.filter((offering) => Boolean(offering.deleted_at)) ?? []
      : statusFilter === "ALL"
        ? offeringsQuery.data?.items ?? []
        : offeringsQuery.data?.items.filter((offering) => !offering.deleted_at) ?? [];

  const selectedOffering = offeringsQuery.data?.items.find((offering) => offering.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Course Offerings"
        description="The operational unit for assignments and enrollments, tied to term, year, and section."
        actions={
          <Button asChild>
            <Link to="/admin/course-offerings/new">
              <Plus className="h-4 w-4" />
              Create offering
            </Link>
          </Button>
        }
      />

      <ListPanel
        filters={
          <form
            className="grid gap-3 lg:grid-cols-[1.5fr_1.2fr_0.8fr_0.8fr_auto] lg:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              setOffset(0);
              setAppliedSearch(search.trim());
            }}
          >
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by course code, title, or section"
              leadingIcon={<Search className="h-4 w-4" />}
            />
            <Select
              value={courseId ? String(courseId) : ""}
              onChange={(event) => setCourseId(event.target.value ? Number(event.target.value) : undefined)}
            >
              <option value="">All courses</option>
              {coursesQuery.data?.items.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </Select>
            <Select value={term ?? ""} onChange={(event) => setTerm(event.target.value || undefined)}>
              <option value="">All terms</option>
              {academicTerms.map((value) => (
                <option key={value} value={value}>
                  {formatTerm(value)}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Year"
              min={2000}
              max={2100}
              value={year ?? ""}
              onChange={(event) => setYear(event.target.value ? Number(event.target.value) : undefined)}
            />
            <Button variant="secondary" type="submit">
              Apply filters
            </Button>
          </form>
        }
        toolbar={
          <div className="flex items-center justify-end">
            <Select
              className="max-w-[220px]"
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
        }
      >
        {coursesQuery.isLoading || offeringsQuery.isLoading ? (
          <SkeletonTable rows={6} columns={8} />
        ) : offeringsQuery.isError || !offeringsQuery.data ? (
          <ErrorState description="Course offerings could not be loaded." onRetry={() => offeringsQuery.refetch()} />
        ) : visibleOfferings.length === 0 ? (
          <EmptyState
            title="No offerings found"
            description={
              statusFilter === "ARCHIVED"
                ? "No archived offerings match the current filters."
                : "Create the first course offering to start assignments and enrollments."
            }
            icon={<BookOpen className="h-5 w-5" />}
            action={
              <Button asChild size="sm">
                <Link to="/admin/course-offerings/new">Create offering</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <Th>Course</Th>
                    <Th>Term</Th>
                    <Th>Section</Th>
                    <Th>Capacity</Th>
                    <Th>Teachers</Th>
                    <Th>Students</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {visibleOfferings.map((offering) => {
                    const actions: RowAction[] = offering.deleted_at
                      ? []
                      : [
                          {
                            label: "Archive",
                            icon: <Archive />,
                            destructive: true,
                            onSelect: () => setSelectedId(offering.id),
                          },
                        ];

                    return (
                      <TableRow key={offering.id}>
                        <Td className="font-semibold text-ink-900">
                          {coursesById.get(offering.course_id) ?? `${offering.course_code} · ${offering.course_name}`}
                        </Td>
                        <Td>
                          <Badge variant="neutral">
                            {formatTerm(offering.term)} {offering.year}
                          </Badge>
                        </Td>
                        <Td className="tabular">{offering.section}</Td>
                        <Td className="tabular text-slate-500">{offering.capacity ?? "—"}</Td>
                        <Td className="tabular">{offering.teacher_ids.length}</Td>
                        <Td className="tabular">{offering.student_count}</Td>
                        <Td>
                          <StatusPill archived={Boolean(offering.deleted_at)} />
                        </Td>
                        <Td className="text-slate-500">{formatDate(offering.updated_at)}</Td>
                        <Td align="right">
                          <RowActions
                            actions={actions}
                            primaryAction={
                              <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/admin/course-offerings/${offering.id}`}>Open</Link>
                                </Button>
                                <Button variant="ghost" size="icon-sm" asChild aria-label="Edit offering">
                                  <Link to={`/admin/course-offerings/${offering.id}/edit`}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              </div>
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
              total={offeringsQuery.data.total}
              limit={offeringsQuery.data.limit}
              offset={offeringsQuery.data.offset}
              onPageChange={setOffset}
            />
          </>
        )}
      </ListPanel>

      <Dialog
        open={Boolean(selectedOffering)}
        title="Archive course offering?"
        description="This removes the offering from standard lists and should only be done when no longer active."
        confirmLabel="Archive offering"
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
