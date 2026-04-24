import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-white hover:bg-ink-800 focus:ring-ink-700",
        secondary: "bg-white text-ink-900 ring-1 ring-slate-300 hover:bg-slate-100 focus:ring-slate-300",
        ghost: "bg-transparent text-ink-800 hover:bg-white/60 focus:ring-slate-300",
        danger: "bg-danger-500 text-white hover:bg-red-700 focus:ring-red-300",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-5 py-3 text-sm",
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
  };

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  const { children, asChild, ...restProps } = props as ButtonProps & { children?: React.ReactNode };
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(classes, (children.props as { className?: string }).className),
    });
  }

  return (
    <button type={type} className={classes} {...restProps}>
      {children}
    </button>
  );
}
