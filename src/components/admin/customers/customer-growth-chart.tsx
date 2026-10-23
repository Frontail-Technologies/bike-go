"use client";

import { useReducedMotion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminChartTooltip } from "@/components/admin/charts/chart-tooltip";
import type { MetricPoint } from "@/components/admin/data";

export function CustomerGrowthChart({ data }: { data: MetricPoint[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div>
      <p className="sr-only">Total registered customers per month.</p>
      <div className="h-56 min-w-0 w-full" aria-label="Customer growth trend">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 224 }}>
          <AreaChart data={data} accessibilityLayer margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs><linearGradient id="customer-growth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--admin-info)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--admin-info)" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="var(--admin-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 11 }} />
            <Tooltip content={({ active, payload, label }) => <AdminChartTooltip active={active} payload={payload} label={label} />} />
            <Area type="monotone" dataKey="value" name="Customers" stroke="var(--admin-info)" fill="url(#customer-growth)" strokeWidth={2.5} animationDuration={450} isAnimationActive={!reduceMotion} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
