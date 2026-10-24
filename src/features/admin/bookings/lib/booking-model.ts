import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import type { Booking, BookingStatus, FuelLevel, PaymentStatus, VehicleCondition } from "../types/booking";

export const bookingLabels: Record<BookingStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", ready_for_pickup: "Ready for Pickup", active: "On Rent",
  returned: "Returned", completed: "Completed", cancelled: "Cancelled", expired: "Expired", no_show: "No Show",
};

export const paymentLabels: Record<PaymentStatus, string> = { unpaid: "Unpaid", pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded", partially_refunded: "Partially refunded" };

export const actionLabels: Partial<Record<BookingStatus, string>> = {
  confirmed: "Confirm Booking", ready_for_pickup: "Mark Ready for Pickup", active: "Start Rental",
  returned: "Return Vehicle", completed: "Complete Booking", cancelled: "Cancel Booking", no_show: "Mark No Show",
};

export const fuelLabels: Record<FuelLevel, string> = { full: "Full", three_quarters: "3/4", half: "1/2", quarter: "1/4", empty: "Empty" };
export const conditionLabels: Record<VehicleCondition, string> = { excellent: "Excellent", good: "Good", fair: "Fair", needs_attention: "Needs attention" };

const badgeStatus: Record<BookingStatus, AdminStatus> = {
  pending: "pending", confirmed: "confirmed", ready_for_pickup: "ready-for-pickup", active: "ongoing",
  returned: "returned", completed: "completed", cancelled: "cancelled", expired: "expired", no_show: "no-show",
};
export const toBadge = (status: BookingStatus): { status: AdminStatus; label: string; className?: string } => ({
  status: badgeStatus[status], label: bookingLabels[status], className: status === "expired" ? "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]" : undefined,
});

/** Whether the backend currently permits this move. The backend stays authoritative; this only hides what it would refuse. */
export const canMoveTo = (booking: Pick<Booking, "allowedNextStatuses">, status: BookingStatus) => booking.allowedNextStatuses.includes(status);

/** The backend refuses no-show before the scheduled pickup, so the action is only offered after it. */
export const canMarkNoShow = (booking: Pick<Booking, "allowedNextStatuses" | "pickupAt">, now: number) => canMoveTo(booking, "no_show") && Date.parse(booking.pickupAt) <= now;

/** Overdue is derived, never stored: an active rental past its expected return. */
export const isOverdue = (booking: Pick<Booking, "bookingStatus" | "returnAt">, now: number) => booking.bookingStatus === "active" && Date.parse(booking.returnAt) < now;

export const distanceTravelled = (booking: Pick<Booking, "pickupInspection" | "returnInspection">) =>
  booking.pickupInspection && booking.returnInspection ? Math.max(0, booking.returnInspection.odometerKm - booking.pickupInspection.odometerKm) : null;

const minutesBetween = (from: string, to: number) => Math.max(0, Math.round((to - Date.parse(from)) / 60_000));
/** Minutes late: against the actual return once returned, otherwise against now for an active rental. */
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

export const ictLocalToIso = (value: string) => new Date(`${value.length === 16 ? `${value}:00` : value}+07:00`).toISOString();
export const isoToIctLocal = (iso: string) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDate = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtTime = (iso: string) => fmt(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
