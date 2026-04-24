import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
  children,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/35 p-4">
      <Card className="w-full max-w-lg space-y-5 p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-ink-950">{title}</h3>
          {description ? <p className="text-sm text-slate-700">{description}</p> : null}
        </div>
        {children}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} disabled={pending}>
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
