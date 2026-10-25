import { Skeleton } from "@heroui/react";
import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatTone = "accent" | "purple" | "success" | "warning" | "danger";

const tones: Record<StatTone, { chip: string; wash: string }> = {
  accent: { chip: "bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]", wash: "from-[var(--admin-accent-soft)]/70" },
  purple: { chip: "bg-[#efe9ff] text-[#6246c7]", wash: "from-[#efe9ff]/80" },
  success: { chip: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]", wash: "from-[var(--admin-success-soft)]/80" },
  warning: { chip: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]", wash: "from-[var(--admin-warning-soft)]/80" },
  danger: { chip: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]", wash: "from-[var(--admin-danger-soft)]/80" },
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  trend?: { direction: "up" | "down"; value: string; label?: string };
  secondary?: ReactNode;
  loading?: boolean;
  className?: string;
};

export function StatCard({ label, value, icon, tone = "accent", trend, secondary, loading = false, className }: StatCardProps) {
  const Trend = trend?.direction === "down" ? TrendDownIcon : TrendUpIcon;
  const palette = tones[tone];
  return (
    <div className={cn("adminHero adminLift relative isolate flex h-full min-w-0 flex-col items-start gap-3 overflow-hidden rounded-2xl p-4 md:flex-row", className)}>
      <div aria-hidden className={cn("absolute inset-0 -z-10 bg-gradient-to-br to-transparent to-60%", palette.wash)} />
      {icon ? <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", palette.chip)}>{icon}</span> : null}
      <div className="min-w-0 max-w-full flex-1">
        {loading ? <Skeleton className="h-8 w-20 rounded-lg" /> : <p className="truncate text-xl font-extrabold leading-8 sm:text-2xl tracking-tight tabular-nums">{value}</p>}
        <p className="mt-0.5 text-xs font-semibold text-[var(--admin-muted)]">{label}</p>
        {loading ? <Skeleton className="mt-2 h-4 w-28 rounded" /> : trend ? (
          <p className={cn("mt-2 flex items-center gap-1 text-xs font-bold", trend.direction === "up" ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]")}>
            <Trend size={14} weight="bold" aria-hidden />{trend.value}<span className="truncate font-medium text-[var(--admin-muted)]">{trend.label ?? "vs last month"}</span>
          </p>
        ) : secondary ? <div className="mt-2 text-xs text-[var(--admin-muted)]">{secondary}</div> : null}
      </div>
    </div>
  );
}
