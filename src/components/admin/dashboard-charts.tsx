"use client";

import { AdminChartCard, MetricBarChart, RevenueTrendChart, StatusDonutChart } from "@/components/admin/charts";
import { adminDashboard, type DashboardPeriod, type StatusMetric } from "@/components/admin/data";

export function DashboardPrimaryCharts({ period, vehicleStatus }: { period: DashboardPeriod; vehicleStatus: StatusMetric[] }) {
  return <section aria-label="Dashboard charts" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
    <AdminChartCard title="Booking Trends" description={`Booked and paid revenue, last ${period} days (USD).`}><RevenueTrendChart data={adminDashboard.charts.revenue.USD[period]} /></AdminChartCard>
    <AdminChartCard title="Vehicle Status" description={`${adminDashboard.vehicles.total} vehicles across the fleet.`}><StatusDonutChart compact data={vehicleStatus} centerLabel="Vehicles" /></AdminChartCard>
  </section>;
}

export function DashboardActivityCharts({ period }: { period: DashboardPeriod }) {
  return <section aria-label="Activity breakdown" className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)]">
    <AdminChartCard title="Booking Volume" description={`Bookings per period, last ${period} days.`}><MetricBarChart data={adminDashboard.charts.bookingVolume[period]} /></AdminChartCard>
    <AdminChartCard title="Loan Status" description="Current loan application pipeline."><StatusDonutChart compact data={adminDashboard.charts.loanStatus} centerLabel="Applications" /></AdminChartCard>
  </section>;
}
