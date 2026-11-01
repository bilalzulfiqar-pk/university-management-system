import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

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
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const sections = navByRole[user.role];

  return (
    <div className="flex h-full flex-col bg-ink-950 text-ink-200">
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-4">
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

      {/* Nav sections - fills the available height, scrolls internally if needed */}
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
                            ? "bg-white/12 text-white font-semibold"
                            : "text-ink-300 transition-smooth hover:bg-white/8 hover:text-white",
                        )}
                      >
                        {isActive ? (
                          <span
                            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold-500 shadow-[0_0_8px_rgba(212,163,44,0.5)]"
                            aria-hidden
                          />
                        ) : null}
                        {Icon ? (
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0 transition-smooth",
                              isActive ? "text-gold-400" : "text-ink-400 group-hover:text-ink-200",
                            )}
                          />
                        ) : null}
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
    </div>
  );
}
