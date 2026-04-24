import { Menu, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/providers/use-auth";

export function ShellTopbar({ title, description }: { title?: string; description?: string }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-white/70 bg-slate-100/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white p-2 text-ink-800 shadow-sm md:hidden">
            <Menu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{user?.role} Workspace</p>
            {title ? <h1 className="text-2xl font-semibold tracking-tight text-ink-950">{title}</h1> : null}
            {description ? <p className="text-sm text-slate-700">{description}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-3 lg:w-[320px]">
          <div className="relative hidden flex-1 lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search pages and records" disabled />
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Signed in</p>
            <p className="text-sm font-semibold text-ink-950">{user?.first_name ?? user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
