import { Outlet, useLocation } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { ShellSidebar } from "@/components/common/shell-sidebar";
import { ShellTopbar } from "@/components/common/shell-topbar";

const routeCopy: Record<string, { title: string; description: string }> = {
  "/admin/dashboard": {
    title: "Admin Dashboard",
    description: "Track the health of the university data setup and jump into your most common admin tasks.",
  },
  "/teacher/dashboard": {
    title: "Teacher Dashboard",
    description: "Stay focused on your assigned offerings and the students currently in your classes.",
  },
  "/student/dashboard": {
    title: "Student Dashboard",
    description: "Review your profile and enrolled course offerings from one simple home base.",
  },
  "/security": {
    title: "Security Settings",
    description: "Manage authenticator app protection for your account.",
  },
};

export function AppShellLayout() {
  const location = useLocation();
  const copy = routeCopy[location.pathname];

  return (
    <div className="app-shell-grid">
      <ShellSidebar />
      <div className="min-w-0">
        <ShellTopbar title={copy?.title} description={copy?.description} />
        <div className="px-5 py-6 md:px-8">
          <Card className="min-h-[calc(100vh-148px)] bg-white/60 p-4 md:p-6">
            <Outlet />
          </Card>
        </div>
      </div>
    </div>
  );
}
