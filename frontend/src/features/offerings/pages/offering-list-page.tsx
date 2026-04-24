import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { listCourses } from "@/features/courses/api";
import { archiveOffering, listOfferings } from "@/features/offerings/api";
import { academicTerms } from "@/lib/constants/options";
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
import { formatDate, formatTerm } from "@/lib/utils/format";

export function OfferingListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [courseId, setCourseId] = useState<number | undefined>();
  const [term, setTerm] = useState<string | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => listCourses({ limit: 100, offset: 0 }),
  });

  const offeringsQuery = useQuery({
    queryKey: ["offerings", appliedSearch, courseId, term, year, includeDeleted, offset],
    queryFn: () =>
      listOfferings({
        search: appliedSearch,
        course_id: courseId,
        term,
        year,
        include_deleted: includeDeleted,
        limit: 10,
        offset,
      }),
  });

  const coursesById = useMemo(
    () => new Map((coursesQuery.data?.items ?? []).map((course) => [course.id, `${course.code} — ${course.name}`])),
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

  if (coursesQuery.isLoading || offeringsQuery.isLoading) return <LoadingScreen label="Loading course offerings..." />;
  if (coursesQuery.isError || offeringsQuery.isError || !offeringsQuery.data) return <ErrorState description="Course offerings could not be loaded." onRetry={() => offeringsQuery.refetch()} />;

  const selectedOffering = offeringsQuery.data.items.find((offering) => offering.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin module"
        title="Course Offerings"
        description="This is the operational unit for assignments and enrollments, tied to term, year, and section."
        actions={
          <Button asChild>
            <Link to="/admin/course-offerings/new">Create offering</Link>
          </Button>
        }
      />

      <Card className="space-y-4">
        <form
          className="grid gap-3 xl:grid-cols-[1.5fr_1.2fr_0.8fr_0.8fr_auto] xl:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            setOffset(0);
            setAppliedSearch(search.trim());
          }}
        >
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by course code, title, or section" />
          <Select value={courseId ? String(courseId) : ""} onChange={(event) => setCourseId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">All courses</option>
            {coursesQuery.data?.items.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.name}
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

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
          Include archived offerings
        </label>

        {offeringsQuery.data.items.length === 0 ? (
          <EmptyState title="No offerings found" description="Create the first course offering to start assignments and enrollments." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-[16px] border border-slate-200">
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
                    <Th className="text-right">Actions</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {offeringsQuery.data.items.map((offering) => (
                    <tr key={offering.id}>
                      <Td className="font-semibold">{coursesById.get(offering.course_id) ?? `${offering.course_code} — ${offering.course_name}`}</Td>
                      <Td>
                        {formatTerm(offering.term)} {offering.year}
                      </Td>
                      <Td>{offering.section}</Td>
                      <Td>{offering.capacity ?? "—"}</Td>
                      <Td>{offering.teacher_ids.length}</Td>
                      <Td>{offering.student_count}</Td>
                      <Td>
                        <StatusPill archived={Boolean(offering.deleted_at)} />
                      </Td>
                      <Td>{formatDate(offering.updated_at)}</Td>
                      <Td className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/course-offerings/${offering.id}`}>Open</Link>
                          </Button>
                          <Button variant="secondary" size="sm" asChild>
                            <Link to={`/admin/course-offerings/${offering.id}/edit`}>Edit</Link>
                          </Button>
                          {!offering.deleted_at ? (
                            <Button variant="danger" size="sm" onClick={() => setSelectedId(offering.id)}>
                              Archive
                            </Button>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls total={offeringsQuery.data.total} limit={offeringsQuery.data.limit} offset={offeringsQuery.data.offset} onPageChange={setOffset} />
          </>
        )}
      </Card>

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
