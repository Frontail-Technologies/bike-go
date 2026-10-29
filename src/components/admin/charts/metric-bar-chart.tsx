"use client";

import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricPoint } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function MetricBarChart({ data, label: labelProp }: { data: MetricPoint[]; label?: string }) {
  const t = useAdminTranslations();
  const label = labelProp ?? t("nav.bookings");
  const reduceMotion = useReducedMotion();
  if (!data.length) return <ChartEmptyState title={t("ui.charts.noMetricData", { label: label.toLowerCase() })} />;
  return (
    <div>
      <p className="sr-only">{t("ui.charts.barSummary", { label })}</p>
      <div className="h-64 min-w-0 w-full" aria-label={t("ui.charts.barChart", { label })}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 256 }}>
          <BarChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" minTickGap={24} axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <Tooltip content={({ active, payload, label: tooltipLabel }) => <AdminChartTooltip active={active} payload={payload} label={tooltipLabel} />} cursor={{ fill: "var(--admin-surface-muted)" }} />
            <Bar dataKey="value" name={label} fill="var(--admin-info)" radius={[5, 5, 0, 0]} maxBarSize={34} animationDuration={450} isAnimationActive={!reduceMotion} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-[var(--admin-muted)]"><strong className="text-[var(--admin-text)]">{data.reduce((sum, item) => sum + item.value, 0)}</strong> {t("ui.charts.acrossRange", { label: label.toLowerCase() })}</p>
    </div>
  );
}
