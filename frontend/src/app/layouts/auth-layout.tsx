import { Outlet } from "react-router-dom";
import { LockKeyhole, ShieldCheck, ScrollText } from "lucide-react";

import { BrandMark } from "@/components/common/brand-mark";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "Separate admin, teacher, and student workspaces with scoped permissions.",
  },
  {
    icon: LockKeyhole,
    title: "Secure by default",
    description: "HttpOnly session cookies, CSRF protection, and optional two-factor auth.",
  },
  {
    icon: ScrollText,
    title: "Audited operations",
    description: "Every admin write is logged with structured, reviewable audit history.",
  },
];

export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 700px 500px at 20% 10%, rgba(51, 93, 125, 0.45), transparent 60%), radial-gradient(ellipse 600px 400px at 90% 90%, rgba(212, 163, 44, 0.12), transparent 55%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative">
          <BrandMark size={40} tone="light" />
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
              University operations platform
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white">
              Clear workflows for university admins, teachers, and students.
            </h1>
            <p className="text-base leading-relaxed text-ink-300">
              Manage courses, accounts, and academic workflows in one secure, role-based workspace.
            </p>
          </div>

          <ul className="space-y-5">
            {TRUST_POINTS.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gold-400 ring-1 ring-inset ring-white/10">
                  <point.icon className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold text-white">{point.title}</p>
                  <p className="text-sm leading-relaxed text-ink-300">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} University Management System. Built for secure academic operations.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark size={40} tone="dark" />
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
