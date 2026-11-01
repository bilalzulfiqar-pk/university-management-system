import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  /** Display name - used to derive initials and deterministic color. */
  name: string;
  /** Optional secondary identifier (e.g. email) mixed into the color hash. */
  seed?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

const palettes = [
  "bg-ink-100 text-ink-700",
  "bg-info-100 text-info-700",
  "bg-success-100 text-success-700",
  "bg-warning-100 text-warning-700",
  "bg-accent-100 text-accent-700",
  "bg-danger-100 text-danger-700",
] as const;

function hash(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) | 0;
  }
  return Math.abs(value);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, seed, size = "md", className }: AvatarProps) {
  const colorIndex = hash(`${name}:${seed ?? ""}`) % palettes.length;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        sizes[size],
        palettes[colorIndex],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
