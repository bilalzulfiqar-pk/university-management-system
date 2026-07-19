import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, UserCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown";
import { BrandMark } from "@/components/common/brand-mark";
import { useAuth } from "@/app/providers/use-auth";
import { navByRole } from "@/lib/constants/navigation";
import { navIconFor } from "@/lib/constants/icons";
import { cn } from "@/lib/utils/cn";

interface ShellSidebarProps {
  collapsed: boolean;
  /** Called when a navigation link is activated (closes the mobile drawer). */
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

export function ShellSidebar({ collapsed, onNavigate, onToggleCollapse }: ShellSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const sections = navByRole[user.role];
  const userName = user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user.email;
  const profilePath =
    user.role === "ADMIN" ? "/admin/dashboard" : `/${user.role.toLowerCase()}/profile`;

  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-200">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
        <BrandMark size={32} compact={collapsed} showWordmark={!collapsed} tone="light" />
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-md p-1.5 text-ink-400 transition-smooth hover:bg-white/5 hover:text-white lg:block"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-smooth", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              {!collapsed ? (
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  {section.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = navIconFor[item.to];
                  const isActive =
                    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                          collapsed && "justify-center",
                          isActive
                            ? "bg-white/8 text-white"
                            : "text-ink-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {isActive ? (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold-500"
                            aria-hidden
                          />
                        ) : null}
                        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" /> : null}
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User card + actions */}
      <div className="border-t border-white/5 p-3">
        <Dropdown
          align="left"
          trigger={
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-smooth hover:bg-white/5",
                collapsed && "justify-center",
              )}
            >
              <Avatar name={userName} seed={user.email} size="sm" />
              {!collapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{userName}</span>
                  <span className="block truncate text-xs text-ink-400">{user.email}</span>
                </span>
              ) : null}
            </button>
          }
        >
          {(close) => (
            <>
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-ink-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <Badge variant="ink" className="mt-2">
                  {user.role}
                </Badge>
              </div>
              <DropdownSeparator />
              <DropdownItem
                icon={<UserCircle />}
                onClick={() => {
                  close();
                  navigate(profilePath);
                  onNavigate?.();
                }}
              >
                Profile
              </DropdownItem>
              <DropdownItem icon={<LogOut />} destructive onClick={() => void logout()}>
                Sign out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </div>
  );
}
