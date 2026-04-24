import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50">
      <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_left,_rgba(42,83,125,0.18),_transparent_42%)] lg:block" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="hidden max-w-xl flex-1 space-y-6 pr-12 lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink-700">University Management System</p>
          <h1 className="text-5xl font-semibold leading-tight text-ink-950">
            Calm, clear operations for admins, teachers, and students.
          </h1>
          <p className="max-w-lg text-base leading-7 text-slate-700">
            This dashboard turns the backend you built into a real working academic workspace with role-aware
            navigation, predictable forms, and secure day-to-day flows.
          </p>
        </div>
        <div className="w-full lg:max-w-lg">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
