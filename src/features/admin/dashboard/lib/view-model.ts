import type { MetricPoint, RevenueTrendPoint, StatusMetric } from "@/components/admin/data";
import { type BookingStatus, bookingStatuses } from "@/components/admin/bookings/booking-data";
import type { DashboardOverview, DashboardRange } from "../types/dashboard";

export const rangeOptions: ReadonlyArray<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const rangeDays = (range: DashboardRange) => Number.parseInt(range, 10);

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

const vehicleColors: Record<string, string> = { available: "var(--admin-success)", rented: "var(--admin-info)", maintenance: "var(--admin-warning)", inactive: "var(--admin-muted)" };
const loanColors: Record<string, string> = {
  approved: "var(--admin-success)",
  documents_under_review: "var(--admin-info)",
  eligibility_review: "var(--admin-info)",
  submitted: "var(--admin-warning)",
  additional_documents_required: "var(--admin-warning)",
  rejected: "var(--admin-danger)",
  draft: "var(--admin-muted)",
};

const toMetrics = (counts: Record<string, number>, colors: Record<string, string>): StatusMetric[] =>
  Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({ label: titleCase(status), value, color: colors[status] ?? "var(--admin-muted)" }));

export const vehicleStatusMetrics = (data: DashboardOverview) => toMetrics(data.vehicles.byStatus, vehicleColors);
export const loanStatusMetrics = (data: DashboardOverview) => toMetrics(data.loans.byStatus, loanColors);

const dayLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));

/** Charts show an empty state instead of a flat line when nothing happened in the range. */
export function revenuePoints(data: DashboardOverview): RevenueTrendPoint[] {
  const series = data.trends?.revenue ?? [];
  return series.some((point) => point.bookedMinor > 0 || point.paidMinor > 0) ? series.map((point) => ({ label: dayLabel(point.date), bookedMinor: point.bookedMinor, paidMinor: point.paidMinor })) : [];
}

export function volumePoints(data: DashboardOverview): MetricPoint[] {
  const series = data.trends?.bookings ?? [];
  return series.some((point) => point.count > 0) ? series.map((point) => ({ label: dayLabel(point.date), value: point.count })) : [];
}

export const usdRevenue = (data: DashboardOverview) => data.bookings.revenue.find((entry) => entry.currency === "USD") ?? { currency: "USD" as const, bookedMinor: 0, paidMinor: 0 };

export const toBookingStatus = (status: string): BookingStatus => ((bookingStatuses as readonly string[]).includes(status) ? (status as BookingStatus) : "pending");
