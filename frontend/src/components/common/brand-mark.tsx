import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  /** Size of the crest glyph in pixels. */
  size?: number;
  /** Show the wordmark beside the crest. */
  showWordmark?: boolean;
  /** Compact wordmark - drops the "University Management System" sub-label. */
  compact?: boolean;
  /** Visual treatment: "light" for dark backgrounds (sidebar/auth), "dark" for light backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

/**
 * University crest + wordmark. The crest is a graduation cap rendered in the
 * navy/gold brand palette, used on the sidebar, auth panel, and login card.
 */
export function BrandMark({
  size = 36,
  showWordmark = true,
  compact = false,
  tone = "light",
  className,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Crest size={size} />
      {showWordmark ? (
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "truncate font-display text-[15px] font-bold tracking-tight",
              tone === "light" ? "text-white" : "text-ink-900",
            )}
          >
            University MS
          </p>
          {!compact ? (
            <p
              className={cn(
                "truncate text-[11px] font-medium tracking-[0.18em] uppercase",
                tone === "light" ? "text-ink-300" : "text-slate-500",
              )}
            >
              Operations Hub
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Standalone graduation-cap crest glyph. */
export function Crest({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="University Management System"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill="#0a1626" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" stroke="#264966" strokeOpacity="0.5" />
      <path d="M32 14L54 23L32 32L10 23L32 14Z" fill="#e6eef6" />
      <path d="M20 28.5V37.5C20 37.5 24.5 41.5 32 41.5C39.5 41.5 44 37.5 44 37.5V28.5L32 33.5L20 28.5Z" fill="#d4a32c" />
      <path d="M54 23V33.5" stroke="#e6eef6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="54" cy="35.5" r="2.6" fill="#d4a32c" />
      <path d="M54 35.5V41" stroke="#d4a32c" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M49.5 41C49.5 42.5 51 43.5 54 43.5C57 43.5 58.5 42.5 58.5 41"
        stroke="#d4a32c"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
