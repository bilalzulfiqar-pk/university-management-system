import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Search, ShieldCheck, UserCircle, Command } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/dropdown";
import { useAuth } from "@/app/providers/use-auth";
import { breadcrumbFor } from "@/lib/constants/route-registry";
import { cn } from "@/lib/utils/cn";

interface ShellTopbarProps {
  title: string;
  description?: string;
  onOpenMenu: () => void;
  onOpenCommandPalette: () => void;
}

export function ShellTopbar({ title, description, onOpenMenu, onOpenCommandPalette }: ShellTopbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = `${title} · University MS`;
  }, [title]);

  const crumbs = user ? breadcrumbFor(location.pathname, user.role) : [];
  const userName = user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user?.email ?? "";
  const profilePath =
    user?.role === "ADMIN" ? "/admin/dashboard" : user ? `/${user.role.toLowerCase()}/profile` : "/login";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md transition-smooth",
        scrolled ? "border-slate-200 shadow-sm" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="rounded-md p-2 text-ink-700 transition-smooth hover:bg-ink-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 flex-1 lg:block">
          <Breadcrumb items={crumbs} />
        </div>

        <div className="min-w-0 flex-1 lg:hidden">
          <p className="truncate font-display text-base font-semibold text-ink-900">{title}</p>
        </div>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="group flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 transition-smooth hover:border-slate-300 hover:text-ink-700 md:w-64 md:justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search…</span>
          </span>
          <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 md:inline-flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {user ? (
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-smooth hover:bg-ink-50"
                aria-label="Account menu"
              >
                <Avatar name={userName} seed={user.email} size="sm" />
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium text-ink-900">
                    {user.first_name ?? user.email}
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-400">{user.role}</span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 transition-smooth lg:block" />
              </button>
            }
          >
            {(close) => (
              <>
                <DropdownLabel>
                  <span className="block truncate">{userName}</span>
                  <span className="block truncate text-xs font-normal text-slate-400">{user.email}</span>
                </DropdownLabel>
                <DropdownSeparator />
                <DropdownItem
                  icon={<UserCircle />}
                  onClick={() => {
                    close();
                    navigate(profilePath);
                  }}
                >
                  Profile
                </DropdownItem>
                <DropdownItem
                  icon={<ShieldCheck />}
                  onClick={() => {
                    close();
                    navigate("/security");
                  }}
                >
                  Security
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<LogOut />} destructive onClick={() => void logout()}>
                  Sign out
                </DropdownItem>
              </>
            )}
          </Dropdown>
        ) : null}
      </div>

      {description ? (
        <div className="mx-auto hidden max-w-[1440px] px-6 pb-3 lg:block lg:px-8">
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
      ) : null}
    </header>
  );
}
