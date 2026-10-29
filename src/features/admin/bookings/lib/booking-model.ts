import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { formatDate, formatDateTime, formatShort, formatTime, ictLocalToIso, isoToIctLocal } from "@/lib/date";
import { adminLabels, adminT } from "@/features/admin/i18n/translate";
import { bookingStatuses, fuelLevels, paymentStatuses, vehicleConditions, type Booking, type BookingStatus } from "../types/booking";
import { bookingStatus } from "@/lib/status/booking";

export const bookingLabels = adminLabels("bookings.status", bookingStatuses);

export const paymentLabels = adminLabels("bookings.payment", paymentStatuses);

export const actionLabels: Partial<Record<BookingStatus, string>> = adminLabels("bookings.action", ["confirmed", "ready_for_pickup", "active", "returned", "completed", "cancelled", "no_show"] as const);

export const fuelLabels = adminLabels("bookings.fuel", fuelLevels);
export const conditionLabels = adminLabels("bookings.condition", vehicleConditions);

const badgeStatus = Object.fromEntries(Object.entries(bookingStatus).map(([code, meta]) => [code, meta.tone])) as Record<BookingStatus, AdminStatus>;
export const toBadge = (status: BookingStatus): { status: AdminStatus; label: string; className?: string } => ({
  status: badgeStatus[status], label: bookingLabels[status], className: status === "expired" ? "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]" : undefined,
});

export const canMoveTo = (booking: Pick<Booking, "allowedNextStatuses">, status: BookingStatus) => booking.allowedNextStatuses.includes(status);

export const canMarkNoShow = (booking: Pick<Booking, "allowedNextStatuses" | "pickupAt">, now: number) => canMoveTo(booking, "no_show") && Date.parse(booking.pickupAt) <= now;

export const isOverdue = (booking: Pick<Booking, "bookingStatus" | "returnAt">, now: number) => booking.bookingStatus === "active" && Date.parse(booking.returnAt) < now;

export const distanceTravelled = (booking: Pick<Booking, "pickupInspection" | "returnInspection">) =>
  booking.pickupInspection && booking.returnInspection ? Math.max(0, booking.returnInspection.odometerKm - booking.pickupInspection.odometerKm) : null;

const minutesBetween = (from: string, to: number) => Math.max(0, Math.round((to - Date.parse(from)) / 60_000));
export const lateMinutes = (booking: Pick<Booking, "bookingStatus" | "returnAt" | "returnInspection">, now: number) =>
  booking.returnInspection ? minutesBetween(booking.returnAt, Date.parse(booking.returnInspection.occurredAt)) : booking.bookingStatus === "active" ? minutesBetween(booking.returnAt, now) : 0;

export const durationLabel = (minutes: number) => {
  if (minutes < 60) return adminT("bookings.duration.minutes", { count: minutes });
  if (minutes < 1440) return minutes % 60 ? adminT("bookings.duration.hoursMinutes", { hours: Math.floor(minutes / 60), minutes: minutes % 60 }) : adminT("bookings.duration.hours", { count: minutes / 60 });
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return hours ? adminT("bookings.duration.daysHours", { days, hours }) : adminT("bookings.duration.days", { count: days });
};

export const vehiclePhoto = (vehicle: Booking["vehicle"]) => ({ id: vehicle.id, name: vehicle.name, vehicleType: vehicle.vehicleType, images: vehicle.image ? [vehicle.image] : [] });

export { ictLocalToIso, isoToIctLocal };
export const fmtDate = formatDate;
export const fmtDateTime = formatDateTime;
export const fmtShort = formatShort;
export const fmtTime = formatTime;
