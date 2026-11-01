import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { ShellSidebar } from "@/components/common/shell-sidebar";
import { ShellTopbar } from "@/components/common/shell-topbar";
import { CommandPalette } from "@/components/common/command-palette";
import { resolveRoute } from "@/lib/constants/route-registry";

const COLLAPSE_KEY = "ums:sidebar-collapsed";

function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  // Only collapse on large screens - never start collapsed on tablet where the
  // sidebar is a drawer.
  if (window.matchMedia("(min-width: 1024px)").matches) {
    try {
      return window.sessionStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  }
  return false;
}

export function AppShellLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(readInitialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Resolve route metadata for the topbar + document title.
  const route = resolveRoute(location.pathname);

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Close the drawer on Escape (the command palette handles its own Escape).
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggleCollapse = () => {
    setCollapsed((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
        } catch {
          // Ignore storage quota or disabled storage errors
        }
      }
      return next;
    });
  };

  return (
    <div
      className="app-shell"
      style={{ ["--sidebar-width" as string]: collapsed ? "76px" : "264px" }}
    >
      {/* Desktop sidebar */}
      <aside
        className="app-shell__sidebar hidden lg:block"
        aria-label="Sidebar navigation"
      >
        <ShellSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="app-shell__sidebar is-open absolute inset-y-0 left-0 w-[280px] shadow-xl">
            <ShellSidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="app-shell__main">
        <ShellTopbar
          title={route.title}
          description={route.description}
          onOpenMenu={() => setDrawerOpen(true)}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />

        <main className="app-shell__content">
          <div key={location.pathname} className="page-fade">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
