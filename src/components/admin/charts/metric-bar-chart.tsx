"use client";

import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricPoint } from "@/components/admin/data";
import { AdminChartTooltip } from "./chart-tooltip";
import { ChartEmptyState } from "./chart-empty-state";

export function MetricBarChart({ data, label = "Bookings" }: { data: MetricPoint[]; label?: string }) {
  const reduceMotion = useReducedMotion();
  if (!data.length) return <ChartEmptyState title={`No ${label.toLowerCase()} data`} />;
  return (
    <div>
      <p className="sr-only">{label} by period. Values are also available in the chart tooltip.</p>
      <div className="h-64 min-w-0 w-full" aria-label={`${label} bar chart`}>
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
      <p className="mt-3 text-xs text-[var(--admin-muted)]"><strong className="text-[var(--admin-text)]">{data.reduce((sum, item) => sum + item.value, 0)}</strong> {label.toLowerCase()} across the selected range</p>
    </div>
  );
}
