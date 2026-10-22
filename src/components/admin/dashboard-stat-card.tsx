import { MetricTicker } from "@/components/motion/metric-ticker";
import { StatCard } from "@/components/admin/data-display/stat-card";

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
  return <StatCard label={label} value={<MetricTicker value={value} format={formats[format]} />} icon={icon} trend={{ direction: trend, value: `${delta}%` }} className={className} />;
}
