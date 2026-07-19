import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown";

export interface RowAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * Row-level "kebab" action menu. Renders a single inline trigger and an
 * accessible dropdown of actions. Use `separatorAfter` to split primary
 * (Edit/Open) actions from destructive (Archive/Delete) ones.
 */
export function RowActions({
  actions,
  separatorAfterIndex,
  primaryAction,
}: {
  actions: RowAction[];
  /** Insert a separator after this action index. */
  separatorAfterIndex?: number;
  /** Optional primary inline action (e.g. an "Edit" button) shown before the kebab. */
  primaryAction?: ReactNode;
}) {
  if (actions.length === 0) {
    return primaryAction ? <>{primaryAction}</> : null;
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {primaryAction}
      <Dropdown
        align="right"
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Row actions"
            className="text-slate-400 hover:text-ink-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      >
        {(close) => (
          <>
            {actions.map((action, index) => (
              <div key={action.label}>
                <DropdownItem
                  icon={action.icon}
                  destructive={action.destructive}
                  disabled={action.disabled}
                  onClick={() => {
                    close();
                    action.onSelect();
                  }}
                >
                  {action.label}
                </DropdownItem>
                {separatorAfterIndex === index ? <DropdownSeparator /> : null}
              </div>
            ))}
          </>
        )}
      </Dropdown>
    </div>
  );
}
