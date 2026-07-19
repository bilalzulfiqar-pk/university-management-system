import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";

import { listMyTeacherOfferingStudents, listMyTeacherOfferings } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/common/page-header";
import { FactGrid } from "@/components/common/fact-grid";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, Td, Th, TableRow } from "@/components/ui/table";
import { formatTerm, fullName } from "@/lib/utils/format";

export function TeacherOfferingDetailPage() {
  const params = useParams();
  const offeringId = Number(params.id);
  const offeringsQuery = useQuery({
    queryKey: ["my-teacher-offerings"],
    queryFn: () => listMyTeacherOfferings({ limit: 50, offset: 0 }),
  });
  const studentsQuery = useQuery({
    queryKey: ["my-teacher-offering-students", offeringId],
    queryFn: () => listMyTeacherOfferingStudents(offeringId, { limit: 100, offset: 0 }),
  });

  const offering = offeringsQuery.data?.items.find((item) => item.id === offeringId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher roster"
        title={offering ? `${offering.course_code} · ${formatTerm(offering.term)} ${offering.year}` : "Offering"}
        description="Only students in offerings assigned to you appear here."
      />

      {offeringsQuery.isLoading || studentsQuery.isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-24 w-full rounded-card" />
          <SkeletonTable rows={5} columns={5} />
        </div>
      ) : offeringsQuery.isError || studentsQuery.isError || !offeringsQuery.data || !studentsQuery.data ? (
        <ErrorState description="Roster could not be loaded." onRetry={() => studentsQuery.refetch()} />
      ) : !offering ? (
        <ErrorState description="This offering is not assigned to your account." />
      ) : (
        <>
          <Card>
            <CardTitle>Offering overview</CardTitle>
            <CardDescription className="mt-1">Section details at a glance.</CardDescription>
            <div className="mt-5">
              <FactGrid
                facts={[
                  { label: "Course", value: `${offering.course_code} · ${offering.course_name}` },
                  { label: "Term", value: `${formatTerm(offering.term)} ${offering.year}` },
                  { label: "Section", value: offering.section },
                  { label: "Enrolled students", value: offering.student_count },
                ]}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Roster</CardTitle>
            <CardDescription className="mt-1">Students enrolled in this section.</CardDescription>
            <div className="mt-5">
              {studentsQuery.data.items.length === 0 ? (
                <EmptyState
                  title="No students enrolled yet"
                  description="This roster will populate as soon as the admin enrolls students into the offering."
                  icon={<UsersRound className="h-5 w-5" />}
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <Table>
                    <TableHead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Roll number</Th>
                        <Th>Email</Th>
                        <Th>Semester</Th>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {studentsQuery.data.items.map((student) => {
                        const name = fullName(student.first_name, student.last_name);
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
                            <Td className="tabular">{student.current_semester}</Td>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
