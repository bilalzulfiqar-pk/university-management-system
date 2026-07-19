import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-ink-900 text-white shadow-sm hover:bg-ink-800 focus-visible:ring-ink-600/40",
        secondary:
          "bg-white text-ink-800 ring-1 ring-inset ring-slate-300 shadow-xs hover:bg-slate-50 hover:text-ink-900 hover:ring-slate-400 focus-visible:ring-ink-600/30",
        outline:
          "bg-transparent text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-ink-600/30",
        ghost:
          "bg-transparent text-ink-700 hover:bg-ink-50 hover:text-ink-900 focus-visible:ring-ink-600/30",
        danger:
          "bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus-visible:ring-danger-500/40",
        subtle: "bg-ink-50 text-ink-700 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-600/30",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  type = "button",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const { children, asChild, ...restProps } = props as ButtonProps & { children?: React.ReactNode };
  const classes = cn(buttonVariants({ variant, size }), className);
  const isDisabled = disabled || loading;

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(classes, (children.props as { className?: string }).className),
    });
  }

  return (
    <button type={type} className={classes} disabled={isDisabled} {...restProps}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
