import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

interface DropdownProps {
  /** The trigger element. Wrap with a button; styling is your responsibility. */
  trigger: ReactNode;
  /**
   * Panel content. May be a node or a render function receiving a `close`
   * callback so menu items can close the menu on selection.
   */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Horizontal alignment of the floating panel relative to the trigger. */
  align?: "left" | "right";
  className?: string;
}

/**
 * Lightweight accessible dropdown menu. Closes on outside click, Escape, and
 * (optionally) on selecting an item. The trigger controls open state.
 */
export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) {
        const panel = document.getElementById("ums-dropdown-panel");
        if (!panel?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const open = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 240;
    const left = align === "right" ? Math.max(8, rect.right - panelWidth) : rect.left;
    setCoords({ top: rect.bottom + 8, left });
    setIsOpen(true);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-block", className)}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
      >
        {trigger}
      </div>

      {isOpen && coords
        ? createPortal(
            <div
              id="ums-dropdown-panel"
              role="menu"
              className="fixed z-[120] w-60 animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-dropdown"
              style={{ top: coords.top, left: coords.left }}
            >
              {typeof children === "function"
                ? (children as (close: () => void) => ReactNode)(() => setIsOpen(false))
                : children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled,
  destructive,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-smooth",
        disabled
          ? "cursor-not-allowed text-slate-400"
          : destructive
            ? "text-danger-600 hover:bg-danger-50"
            : "text-ink-800 hover:bg-ink-50",
      )}
    >
      {icon ? <span className="text-slate-400 [&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-slate-200" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{children}</p>;
}
