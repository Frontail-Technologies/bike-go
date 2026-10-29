import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { formatDate, formatDateTime, formatShort, formatTime, ictLocalToIso, isoToIctLocal } from "@/lib/date";
import type { Booking, BookingStatus, FuelLevel, PaymentStatus, VehicleCondition } from "../types/booking";
import { bookingStatus, paymentStatus } from "@/lib/status/booking";

export const bookingLabels = Object.fromEntries(Object.entries(bookingStatus).map(([code, meta]) => [code, meta.label])) as Record<BookingStatus, string>;

export const paymentLabels = Object.fromEntries(Object.entries(paymentStatus).map(([code, meta]) => [code, meta.label])) as Record<PaymentStatus, string>;

export const actionLabels: Partial<Record<BookingStatus, string>> = {
  confirmed: "Confirm Booking", ready_for_pickup: "Mark Ready for Pickup", active: "Start Rental",
  returned: "Return Vehicle", completed: "Complete Booking", cancelled: "Cancel Booking", no_show: "Mark No Show",
};

export const fuelLabels: Record<FuelLevel, string> = { full: "Full", three_quarters: "3/4", half: "1/2", quarter: "1/4", empty: "Empty" };
export const conditionLabels: Record<VehicleCondition, string> = { excellent: "Excellent", good: "Good", fair: "Fair", needs_attention: "Needs attention" };

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
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${days}d${hours ? ` ${hours}h` : ""}`;
};

export const vehiclePhoto = (vehicle: Booking["vehicle"]) => ({ id: vehicle.id, name: vehicle.name, vehicleType: vehicle.vehicleType, images: vehicle.image ? [vehicle.image] : [] });

export { ictLocalToIso, isoToIctLocal };
export const fmtDate = formatDate;
export const fmtDateTime = formatDateTime;
export const fmtShort = formatShort;
export const fmtTime = formatTime;
