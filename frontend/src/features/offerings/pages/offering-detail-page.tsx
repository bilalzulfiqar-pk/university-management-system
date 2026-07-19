import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, UserMinus, UserPlus, UsersRound } from "lucide-react";

import { listStudents } from "@/features/students/api";
import { listTeachers } from "@/features/teachers/api";
import {
  assignTeacher,
  enrollStudent,
  getOffering,
  unassignTeacher,
  unenrollStudent,
} from "@/features/offerings/api";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { FactGrid } from "@/components/common/fact-grid";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTerm, fullName } from "@/lib/utils/format";

export function OfferingDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const offeringId = Number(params.id);
  const [teacherId, setTeacherId] = useState<number | undefined>();
  const [studentId, setStudentId] = useState<number | undefined>();

  const offeringQuery = useQuery({
    queryKey: ["offering", offeringId],
    queryFn: () => getOffering(offeringId, true),
  });

  const teachersQuery = useQuery({
    queryKey: ["teachers-options"],
    queryFn: () => listTeachers({ include_deleted: false, limit: 100, offset: 0 }),
  });

  const studentsQuery = useQuery({
    queryKey: ["students-options"],
    queryFn: () => listStudents({ include_deleted: false, limit: 100, offset: 0 }),
  });

  const assignedTeachers = useMemo(
    () => teachersQuery.data?.items.filter((teacher) => offeringQuery.data?.teacher_ids.includes(teacher.id)) ?? [],
    [teachersQuery.data, offeringQuery.data],
  );

  const availableTeachers = useMemo(
    () => teachersQuery.data?.items.filter((teacher) => !offeringQuery.data?.teacher_ids.includes(teacher.id)) ?? [],
    [teachersQuery.data, offeringQuery.data],
  );

  const assignMutation = useMutation({
    mutationFn: (selectedTeacherId: number) => assignTeacher(offeringId, selectedTeacherId),
    onSuccess: (result) => {
      toast.success(result.message);
      setTeacherId(undefined);
      queryClient.invalidateQueries({ queryKey: ["offering", offeringId] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Teacher assignment failed."),
  });

  const unassignMutation = useMutation({
    mutationFn: (selectedTeacherId: number) => unassignTeacher(offeringId, selectedTeacherId),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["offering", offeringId] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Teacher unassignment failed."),
  });

  const enrollMutation = useMutation({
    mutationFn: (selectedStudentId: number) => enrollStudent(offeringId, selectedStudentId),
    onSuccess: (result) => {
      toast.success(result.message);
      setStudentId(undefined);
      queryClient.invalidateQueries({ queryKey: ["offering", offeringId] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Student enrollment failed."),
  });

  const unenrollMutation = useMutation({
    mutationFn: (selectedStudentId: number) => unenrollStudent(offeringId, selectedStudentId),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["offering", offeringId] });
      queryClient.invalidateQueries({ queryKey: ["offerings"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Student unenrollment failed."),
  });

  const isLoading = offeringQuery.isLoading || teachersQuery.isLoading || studentsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Offering detail"
        title={offeringQuery.data ? `${offeringQuery.data.course_code} · ${formatTerm(offeringQuery.data.term)} ${offeringQuery.data.year}` : "Offering"}
        description="Overview, teacher assignment, and enrollment actions for this course section."
        actions={
          <Button variant="secondary" asChild>
            <Link to={`/admin/course-offerings/${offeringId}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-64 w-full rounded-card" />
        </div>
      ) : offeringQuery.isError || !offeringQuery.data || teachersQuery.isError || studentsQuery.isError ? (
        <ErrorState
          description="The course offering detail could not be loaded."
          onRetry={() => offeringQuery.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Overview */}
            <Card>
              <CardTitle>Overview</CardTitle>
              <CardDescription className="mt-1">Core details for this course section.</CardDescription>
              <div className="mt-5">
                <FactGrid
                  facts={[
                    { label: "Course", value: `${offeringQuery.data.course_code} · ${offeringQuery.data.course_name}` },
                    { label: "Term", value: `${formatTerm(offeringQuery.data.term)} ${offeringQuery.data.year}` },
                    { label: "Section", value: offeringQuery.data.section },
                    {
                      label: "Capacity",
                      value: offeringQuery.data.capacity ? String(offeringQuery.data.capacity) : "No limit",
                    },
                    { label: "Assigned teachers", value: offeringQuery.data.teacher_ids.length },
                    { label: "Enrolled students", value: offeringQuery.data.student_count },
                    { label: "Created", value: formatDate(offeringQuery.data.created_at) },
                    { label: "Updated", value: formatDate(offeringQuery.data.updated_at) },
                  ]}
                />
              </div>
            </Card>

            {/* Teachers */}
            <Card>
              <CardTitle>Assigned teachers</CardTitle>
              <CardDescription className="mt-1">Faculty teaching this section.</CardDescription>

              <div className="mt-5 space-y-2">
                {assignedTeachers.length === 0 ? (
                  <EmptyState
                    title="No teachers assigned"
                    description="Assign a teacher to this offering."
                    icon={<UsersRound className="h-4 w-4" />}
                  />
                ) : (
                  assignedTeachers.map((teacher) => {
                    const name = fullName(teacher.first_name, teacher.last_name);
                    return (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={name} seed={teacher.email} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
                            <p className="truncate text-xs text-slate-500">{teacher.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unassignMutation.mutate(teacher.id)}
                          loading={unassignMutation.isPending}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Unassign
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-200/80 pt-4 sm:flex-row">
                <Select
                  value={teacherId ? String(teacherId) : ""}
                  onChange={(event) => setTeacherId(event.target.value ? Number(event.target.value) : undefined)}
                >
                  <option value="">Select teacher to assign</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {fullName(teacher.first_name, teacher.last_name)} ({teacher.employee_id})
                    </option>
                  ))}
                </Select>
                <Button
                  disabled={!teacherId}
                  loading={assignMutation.isPending}
                  onClick={() => teacherId && assignMutation.mutate(teacherId)}
                >
                  <UserPlus className="h-4 w-4" />
                  Assign
                </Button>
              </div>
            </Card>
          </div>

          {/* Enrollment */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Enrollment</CardTitle>
                <CardDescription className="mt-1">Enroll or unenroll a specific student.</CardDescription>
              </div>
              <Badge variant="accent">{offeringQuery.data.student_count} currently enrolled</Badge>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Select
                value={studentId ? String(studentId) : ""}
                onChange={(event) => setStudentId(event.target.value ? Number(event.target.value) : undefined)}
              >
                <option value="">Select student</option>
                {studentsQuery.data?.items.map((student) => (
                  <option key={student.id} value={student.id}>
                    {fullName(student.first_name, student.last_name)} ({student.roll_number})
                  </option>
                ))}
              </Select>
              <Button disabled={!studentId} loading={enrollMutation.isPending} onClick={() => studentId && enrollMutation.mutate(studentId)}>
                <UserPlus className="h-4 w-4" />
                Enroll
              </Button>
              <Button
                variant="secondary"
                disabled={!studentId}
                loading={unenrollMutation.isPending}
                onClick={() => studentId && unenrollMutation.mutate(studentId)}
              >
                <UserMinus className="h-4 w-4" />
                Unenroll
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
