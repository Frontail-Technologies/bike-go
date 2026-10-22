import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react/ssr";
import { MetricTicker } from "@/components/motion/metric-ticker";
import { cn } from "@/lib/cn";

const formats = {
  currency: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
  number: { maximumFractionDigits: 0 },
} as const satisfies Record<string, Intl.NumberFormatOptions>;

type DashboardStatCardProps = {
  label: string;
  value: number;
  format?: keyof typeof formats;
  /** Percent change vs previous period. */
  delta: number;
  trend: "up" | "down";
  icon?: React.ReactNode;
  className?: string;
};

export function DashboardStatCard({ label, value, format = "number", delta, trend, icon, className }: DashboardStatCardProps) {
  const up = trend === "up";
  const TrendIcon = up ? TrendUpIcon : TrendDownIcon;

  return (
    <div className={cn("flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-subtle">{label}</span>
        {icon ? <span className="flex size-9 items-center justify-center rounded-control bg-brand-soft text-ink">{icon}</span> : null}
      </div>
      <p className="text-2xl font-extrabold tracking-tight">
        <MetricTicker value={value} format={formats[format]} />
      </p>
      <p className={cn("flex items-center gap-1 text-xs font-semibold", up ? "text-[#15803d]" : "text-[#b91c1c]")}>
        <TrendIcon size={16} weight="bold" aria-hidden />
        <span>
          {up ? "Up" : "Down"} {delta}%
        </span>
        <span className="font-medium text-subtle">vs last month</span>
      </p>
    </div>
  );
}
