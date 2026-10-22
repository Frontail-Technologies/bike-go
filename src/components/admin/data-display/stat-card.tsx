import { Skeleton } from "@heroui/react";
import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatCard({ label, value, icon, trend, secondary, loading = false, className }: { label: string; value: ReactNode; icon?: ReactNode; trend?: { direction: "up" | "down"; value: string; label?: string }; secondary?: ReactNode; loading?: boolean; className?: string }) {
  const Trend = trend?.direction === "down" ? TrendDownIcon : TrendUpIcon;
  return (
    <article className={cn("adminSurface rounded-2xl p-4", className)}>
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold text-[var(--admin-muted)]">{label}</p>{icon ? <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]">{icon}</span> : null}</div>
      {loading ? <Skeleton className="mt-3 h-8 w-24 rounded-lg" /> : <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>}
      {loading ? <Skeleton className="mt-2 h-4 w-32 rounded" /> : trend ? <p className={cn("mt-2 flex items-center gap-1 text-xs font-bold", trend.direction === "up" ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]")}><Trend size={14} weight="bold" aria-hidden />{trend.value}<span className="font-medium text-[var(--admin-muted)]">{trend.label ?? "vs last month"}</span></p> : secondary ? <div className="mt-2 text-xs text-[var(--admin-muted)]">{secondary}</div> : null}
    </article>
  );
}
