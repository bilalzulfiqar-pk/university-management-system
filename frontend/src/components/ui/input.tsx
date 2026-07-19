import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const inputSurface =
  "h-10 w-full rounded-input border border-slate-300 bg-white px-3.5 text-sm text-ink-900 " +
  "outline-none transition-smooth placeholder:text-slate-400 " +
  "hover:border-slate-400 focus:border-ink-600 focus:ring-2 focus:ring-ink-600/15 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:placeholder:text-slate-400 " +
  "aria-[invalid=true]:border-danger-400 aria-[invalid=true]:focus:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/15";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional icon rendered inside the left padding. */
  leadingIcon?: ReactNode;
  /** Optional element rendered inside the right padding (e.g. visibility toggle). */
  trailingSlot?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, trailingSlot, invalid, disabled, ...props },
  ref,
) {
  if (leadingIcon || trailingSlot) {
    return (
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(inputSurface, leadingIcon && "pl-10", trailingSlot && "pr-10", className)}
          aria-invalid={invalid || undefined}
          {...props}
        />
        {trailingSlot ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
            {trailingSlot}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      disabled={disabled}
      className={cn(inputSurface, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});
