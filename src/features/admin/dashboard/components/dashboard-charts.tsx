"use client";

import { AdminChartCard, MetricBarChart, RevenueTrendChart, StatusDonutChart } from "@/components/admin/charts";
import type { MetricPoint, RevenueTrendPoint, StatusMetric } from "@/components/admin/data";

export function DashboardPrimaryCharts({ days, revenue, vehicleStatus, vehicleTotal }: { days: number; revenue: RevenueTrendPoint[]; vehicleStatus: StatusMetric[]; vehicleTotal: number }) {
  return (
    <section aria-label="Dashboard charts" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
      <AdminChartCard title="Booking Trends" description={`Booked and paid revenue, last ${days} days (USD).`}><RevenueTrendChart data={revenue} /></AdminChartCard>
      <AdminChartCard title="Vehicle Status" description={`${vehicleTotal} vehicles across the fleet.`}><StatusDonutChart compact data={vehicleStatus} centerLabel="Vehicles" /></AdminChartCard>
    </section>
  );
}

export function DashboardActivityCharts({ days, volume, loanStatus }: { days: number; volume: MetricPoint[]; loanStatus: StatusMetric[] }) {
  return (
    <section aria-label="Activity breakdown" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
      <AdminChartCard title="Booking Volume" description={`Bookings created, last ${days} days.`}><MetricBarChart data={volume} /></AdminChartCard>
      <AdminChartCard title="Loan Status" description="Current loan application pipeline."><StatusDonutChart compact data={loanStatus} centerLabel="Applications" /></AdminChartCard>
    </section>
  );
}

