import { useQuery } from "@tanstack/react-query";

import { getMyStudentProfile } from "@/features/student-portal/api";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";

export function StudentProfilePage() {
  const query = useQuery({ queryKey: ["my-student-profile"], queryFn: getMyStudentProfile });
  if (query.isLoading) return <LoadingScreen label="Loading profile..." />;
  if (query.isError || !query.data) return <ErrorState description="Student profile could not be loaded." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student profile" title="My Profile" description="Your personal details, department, and semester from the backend." />
      <Card className="grid gap-4 md:grid-cols-2">
        <ProfileRow label="Name" value={`${query.data.first_name} ${query.data.last_name}`} />
        <ProfileRow label="Email" value={query.data.email} />
        <ProfileRow label="Roll number" value={query.data.roll_number} />
        <ProfileRow label="Department ID" value={String(query.data.department_id)} />
        <ProfileRow label="Current semester" value={String(query.data.current_semester)} />
        <ProfileRow label="Status" value={query.data.is_active ? "Active" : "Inactive"} />
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink-950">{value}</p>
    </div>
  );
}
