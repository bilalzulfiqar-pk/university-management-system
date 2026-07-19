import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/providers/use-auth";
import { flatNavForRole } from "@/lib/constants/navigation";
import { navIconFor, quickActions } from "@/lib/constants/icons";
import { getRoleHome } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Entry {
  id: string;
  label: string;
  description?: string;
  to: string;
  icon?: React.ReactNode;
  group: "Navigate" | "Actions";
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(() => {
    if (!user) return [];
    const navEntries: Entry[] = flatNavForRole(user.role).map((item) => {
      const Icon = navIconFor[item.to];
      return {
        id: `nav-${item.to}`,
        label: item.label,
        to: item.to,
        icon: Icon ? <Icon className="h-4 w-4" /> : null,
        group: "Navigate",
      };
    });

    const actionEntries: Entry[] = quickActions
      .filter((action) => action.roles.includes(user.role))
      .map((action) => {
        const Icon = action.icon;
        return {
          id: `act-${action.to}`,
          label: action.label,
          description: action.description,
          to: action.to,
          icon: <Icon className="h-4 w-4" />,
          group: "Actions",
        };
      });

    return [...navEntries, ...actionEntries];
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) =>
      `${entry.label} ${entry.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [entries, query]);

  // Keep activeIndex in bounds when the filtered list shrinks (no effect needed).
  const safeActiveIndex = filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % Math.max(filtered.length, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const entry = filtered[safeActiveIndex];
        if (entry) {
          navigate(entry.to);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, safeActiveIndex, navigate, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Group filtered entries preserving order.
  const navEntries = filtered.filter((entry) => entry.group === "Navigate");
  const actionEntries = filtered.filter((entry) => entry.group === "Actions");

  const renderGroup = (label: string, items: Entry[]) => {
    if (items.length === 0) return null;
    return (
      <div className="px-1.5 py-1.5">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        {items.map((entry) => {
          const index = filtered.indexOf(entry);
          const isActive = index === safeActiveIndex;
          return (
            <button
              key={entry.id}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                navigate(entry.to);
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-smooth",
                isActive ? "bg-ink-50 text-ink-900" : "text-ink-800 hover:bg-slate-50",
              )}
            >
              <span className="text-slate-400">{entry.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{entry.label}</span>
                {entry.description ? (
                  <span className="block truncate text-xs text-slate-400">{entry.description}</span>
                ) : null}
              </span>
              {isActive ? (
                <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  const home = user ? getRoleHome(user.role) : "/login";

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center bg-ink-950/50 p-4 pt-[12vh] backdrop-blur-[3px] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search pages and quick actions…"
            className="h-12 border-0 px-0 focus:ring-0 hover:border-0"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink-800">No results for “{query}”</p>
              <p className="mt-1 text-xs text-slate-500">Try a different search term.</p>
            </div>
          ) : (
            <>
              {renderGroup("Navigate", navEntries)}
              {renderGroup("Quick actions", actionEntries)}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">↑↓</kbd>
            to navigate
            <kbd className="ml-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">↵</kbd>
            to select
          </span>
          <button
            type="button"
            onClick={() => {
              navigate(home);
              onClose();
            }}
            className="font-medium text-ink-700 hover:text-ink-900"
          >
            Go home
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
