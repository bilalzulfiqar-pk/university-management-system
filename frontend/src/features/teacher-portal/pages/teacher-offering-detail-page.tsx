import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listMyTeacherOfferingStudents, listMyTeacherOfferings } from "@/features/teacher-portal/api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableHead, Td, Th } from "@/components/ui/table";
import { formatTerm, fullName } from "@/lib/utils/format";

export function TeacherOfferingDetailPage() {
  const params = useParams();
  const offeringId = Number(params.id);
  const offeringsQuery = useQuery({ queryKey: ["my-teacher-offerings"], queryFn: () => listMyTeacherOfferings({ limit: 50, offset: 0 }) });
  const studentsQuery = useQuery({
    queryKey: ["my-teacher-offering-students", offeringId],
    queryFn: () => listMyTeacherOfferingStudents(offeringId, { limit: 100, offset: 0 }),
  });

  if (offeringsQuery.isLoading || studentsQuery.isLoading) return <LoadingScreen label="Loading roster..." />;
  if (offeringsQuery.isError || studentsQuery.isError || !offeringsQuery.data || !studentsQuery.data) return <ErrorState description="Roster could not be loaded." />;

  const offering = offeringsQuery.data.items.find((item) => item.id === offeringId);
  if (!offering) return <ErrorState description="This offering is not assigned to your account." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher roster"
        title={`${offering.course_code} • ${formatTerm(offering.term)} ${offering.year} • Section ${offering.section}`}
        description="Only students in offerings assigned to you appear here."
      />

      <Card className="space-y-4">
        {studentsQuery.data.items.length === 0 ? (
          <EmptyState title="No students enrolled yet" description="This roster will populate as soon as the admin enrolls students into the offering." />
        ) : (
          <div className="overflow-x-auto rounded-[16px] border border-slate-200">
            <Table>
              <TableHead>
                <tr>
                  <Th>Name</Th>
                  <Th>Roll number</Th>
                  <Th>Email</Th>
                  <Th>Department ID</Th>
                  <Th>Semester</Th>
                </tr>
              </TableHead>
              <TableBody>
                {studentsQuery.data.items.map((student) => (
                  <tr key={student.id}>
                    <Td className="font-semibold">{fullName(student.first_name, student.last_name)}</Td>
                    <Td>{student.roll_number}</Td>
                    <Td>{student.email}</Td>
                    <Td>{student.department_id}</Td>
                    <Td>{student.current_semester}</Td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
