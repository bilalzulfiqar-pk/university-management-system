import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { listStudents } from "@/features/students/api";
import { listTeachers } from "@/features/teachers/api";
import { assignTeacher, enrollStudent, getOffering, unassignTeacher, unenrollStudent } from "@/features/offerings/api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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

  if (offeringQuery.isLoading || teachersQuery.isLoading || studentsQuery.isLoading) return <LoadingScreen label="Loading offering detail..." />;
  if (offeringQuery.isError || !offeringQuery.data || teachersQuery.isError || studentsQuery.isError) {
    return <ErrorState description="The course offering detail could not be loaded." onRetry={() => offeringQuery.refetch()} />;
  }

  const offering = offeringQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Offering detail"
        title={`${offering.course_code} • ${formatTerm(offering.term)} ${offering.year} • Section ${offering.section}`}
        description="This operational page combines overview, teacher assignment, and enrollment actions around one course offering."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-ink-950">Overview</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <OverviewItem label="Course" value={`${offering.course_code} - ${offering.course_name}`} />
            <OverviewItem label="Term and year" value={`${formatTerm(offering.term)} ${offering.year}`} />
            <OverviewItem label="Section" value={offering.section} />
            <OverviewItem label="Capacity" value={offering.capacity ? String(offering.capacity) : "No limit set"} />
            <OverviewItem label="Assigned teachers" value={String(offering.teacher_ids.length)} />
            <OverviewItem label="Enrolled students" value={String(offering.student_count)} />
            <OverviewItem label="Created" value={formatDate(offering.created_at)} />
            <OverviewItem label="Updated" value={formatDate(offering.updated_at)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-ink-950">Assigned teachers</h3>
          <div className="space-y-3">
            {assignedTeachers.length === 0 ? <p className="text-sm text-slate-700">No teachers assigned yet.</p> : null}
            {assignedTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-ink-950">{fullName(teacher.first_name, teacher.last_name)}</p>
                  <p className="text-sm text-slate-700">{teacher.email}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => unassignMutation.mutate(teacher.id)} disabled={unassignMutation.isPending}>
                  Unassign
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Select value={teacherId ? String(teacherId) : ""} onChange={(event) => setTeacherId(event.target.value ? Number(event.target.value) : undefined)}>
              <option value="">Select teacher to assign</option>
              {availableTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {fullName(teacher.first_name, teacher.last_name)} ({teacher.employee_id})
                </option>
              ))}
            </Select>
            <Button disabled={!teacherId || assignMutation.isPending} onClick={() => teacherId && assignMutation.mutate(teacherId)}>
              Assign teacher
            </Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-ink-950">Enrollment actions</h3>
            <p className="text-sm text-slate-700">
              The backend currently exposes enrollment mutations plus total student count. Use this action area to enroll or
              unenroll a specific student when you know the target record.
            </p>
          </div>
          <Badge variant="accent">{offering.student_count} currently enrolled</Badge>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Select value={studentId ? String(studentId) : ""} onChange={(event) => setStudentId(event.target.value ? Number(event.target.value) : undefined)}>
            <option value="">Select student</option>
            {studentsQuery.data?.items.map((student) => (
              <option key={student.id} value={student.id}>
                {fullName(student.first_name, student.last_name)} ({student.roll_number})
              </option>
            ))}
          </Select>
          <Button disabled={!studentId || enrollMutation.isPending} onClick={() => studentId && enrollMutation.mutate(studentId)}>
            Enroll student
          </Button>
          <Button variant="secondary" disabled={!studentId || unenrollMutation.isPending} onClick={() => studentId && unenrollMutation.mutate(studentId)}>
            Unenroll student
          </Button>
        </div>
      </Card>
    </div>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50/90 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink-950">{value}</p>
    </div>
  );
}
