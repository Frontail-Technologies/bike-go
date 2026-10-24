import { adminLocations, adminVehicles, type AdminVehicle } from "@/components/admin/data";
import type { AdminStatus } from "@/components/admin/data-display/status-badge";
import { customers } from "@/components/admin/customers/customer-data";

export const bookingStatuses = ["pending", "confirmed", "ready_for_pickup", "active", "returned", "completed", "cancelled", "expired", "no_show"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded", "partially-refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export type FuelLevel = "empty" | "quarter" | "half" | "three_quarters" | "full";
export type VehicleCondition = "excellent" | "good" | "fair" | "needs_attention";

export const NOW = Date.parse("2026-10-23T03:00:00.000Z");

export type BookingAddon = { name: string; quantity: number; unitMinor: number };
export type HandoverInspection = {
  actualPickupAt: string; odometerKm: number; fuelLevel: FuelLevel; condition: VehicleCondition;
  existingDamageNotes: string; photoNames: string[]; licenceVerified: boolean; identityVerified: boolean;
  depositVerified: boolean; staffNotes: string;
};
export type ReturnInspection = {
  actualReturnAt: string; odometerKm: number; fuelLevel: FuelLevel; condition: VehicleCondition;
  newDamageFound: boolean; damageNotes: string; photoNames: string[]; staffNotes: string;
};
export type Booking = {
  reference: string; createdAt: string; status: BookingStatus; paymentStatus: PaymentStatus;
  customer: { id: string; reference: string; name: string; phone: string; email: string; city: string };
  vehicle: AdminVehicle; pickupAt: string; returnAt: string; pickupLocation: string; returnLocation: string;
  days: number; addons: BookingAddon[]; holdExpiresAt: string | null; confirmedAt: string | null; readyAt: string | null;
  handover: HandoverInspection | null; returnInspection: ReturnInspection | null; completedAt: string | null;
  cancelledAt: string | null; cancelReason: string | null; expiredAt: string | null; noShowAt: string | null;
};

export const bookingLabels: Record<BookingStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", ready_for_pickup: "Ready for Pickup", active: "On Rent",
  returned: "Returned", completed: "Completed", cancelled: "Cancelled", expired: "Expired", no_show: "No Show",
};
export const paymentLabels: Record<PaymentStatus, string> = { unpaid: "Unpaid", pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded", "partially-refunded": "Partially refunded" };

export const transitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["ready_for_pickup", "cancelled", "no_show"],
  ready_for_pickup: ["active", "cancelled", "no_show"], active: ["returned"], returned: ["completed"],
  completed: [], cancelled: [], expired: [], no_show: [],
};
export const canCancel = (status: BookingStatus) => ["pending", "confirmed", "ready_for_pickup"].includes(status);
export const canMarkNoShow = (booking: Pick<Booking, "status" | "pickupAt">, now = NOW) => ["confirmed", "ready_for_pickup"].includes(booking.status) && Date.parse(booking.pickupAt) <= now;
export const nextStatuses = (status: BookingStatus) => transitions[status];
export const actionLabels: Partial<Record<BookingStatus, string>> = {
  confirmed: "Confirm Booking", ready_for_pickup: "Mark Ready for Pickup", active: "Start Rental",
  returned: "Return Vehicle", completed: "Complete Booking", cancelled: "Cancel Booking", no_show: "Mark No Show",
};

export const toBadge = (status: BookingStatus): { status: AdminStatus; label: string; className?: string } => {
  const map: Record<BookingStatus, AdminStatus> = {
    pending: "pending", confirmed: "confirmed", ready_for_pickup: "ready-for-pickup", active: "ongoing",
    returned: "returned", completed: "completed", cancelled: "cancelled", expired: "expired", no_show: "no-show",
  };
  return { status: map[status], label: bookingLabels[status], className: status === "expired" ? "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]" : undefined };
};

export const money = (booking: Booking) => {
  const rental = booking.vehicle.dailyRentalPriceMinor * booking.days;
  const addons = booking.addons.reduce((sum, addon) => sum + addon.quantity * addon.unitMinor * booking.days, 0);
  const fee = Math.round((rental + addons) * 0.05);
  const tax = Math.round((rental + addons + fee) * 0.1);
  const deposit = booking.vehicle.securityDepositMinor;
  return { daily: booking.vehicle.dailyRentalPriceMinor, rental, addons, fee, tax, deposit, total: rental + addons + fee + tax + deposit };
};

const ict = (day: string, time: string) => `2026-${day}T${time}:00+07:00`;
const shift = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();
type Seed = { status: BookingStatus; payment: PaymentStatus; vehicle: number; customer: number; created: string; pickup: [string, string]; ret: [string, string]; days: number; pickupLoc: number; returnLoc?: number; addons?: BookingAddon[]; damage?: boolean };
const helmet = { name: "Helmet", quantity: 1, unitMinor: 300 };
const jacket = { name: "Riding jacket", quantity: 1, unitMinor: 500 };

const seeds: Seed[] = [
  { status: "active", payment: "paid", vehicle: 0, customer: 0, created: "10-20T14:30", pickup: ["10-22", "09:00"], ret: ["10-23", "09:00"], days: 1, pickupLoc: 0, addons: [helmet] },
  { status: "pending", payment: "pending", vehicle: 1, customer: 1, created: "10-23T09:50", pickup: ["10-26", "08:30"], ret: ["10-28", "17:00"], days: 2, pickupLoc: 1 },
  { status: "confirmed", payment: "paid", vehicle: 3, customer: 2, created: "10-21T11:05", pickup: ["10-25", "10:00"], ret: ["10-28", "10:00"], days: 3, pickupLoc: 0, returnLoc: 2 },
  { status: "ready_for_pickup", payment: "paid", vehicle: 2, customer: 3, created: "10-19T16:20", pickup: ["10-23", "14:00"], ret: ["10-25", "14:00"], days: 2, pickupLoc: 0, addons: [helmet, jacket] },
  { status: "completed", payment: "paid", vehicle: 4, customer: 4, created: "10-08T10:15", pickup: ["10-10", "09:00"], ret: ["10-12", "17:00"], days: 2, pickupLoc: 1 },
  { status: "cancelled", payment: "refunded", vehicle: 5, customer: 5, created: "10-14T13:40", pickup: ["10-18", "09:00"], ret: ["10-20", "17:00"], days: 2, pickupLoc: 0 },
  { status: "expired", payment: "unpaid", vehicle: 6, customer: 6, created: "10-22T15:10", pickup: ["10-24", "09:00"], ret: ["10-26", "17:00"], days: 2, pickupLoc: 2 },
  { status: "returned", payment: "paid", vehicle: 7, customer: 7, created: "10-02T08:00", pickup: ["10-20", "08:00"], ret: ["10-22", "08:00"], days: 2, pickupLoc: 1, returnLoc: 0, addons: [helmet], damage: true },
  { status: "confirmed", payment: "paid", vehicle: 8, customer: 8, created: "10-22T19:45", pickup: ["10-27", "09:30"], ret: ["10-29", "17:30"], days: 2, pickupLoc: 1 },
  { status: "active", payment: "paid", vehicle: 9, customer: 9, created: "10-18T12:00", pickup: ["10-21", "10:00"], ret: ["10-25", "10:00"], days: 4, pickupLoc: 0, addons: [jacket] },
  { status: "pending", payment: "failed", vehicle: 10, customer: 10, created: "10-23T09:55", pickup: ["10-30", "09:00"], ret: ["11-01", "17:00"], days: 2, pickupLoc: 0 },
  { status: "completed", payment: "partially-refunded", vehicle: 11, customer: 11, created: "09-28T09:10", pickup: ["09-30", "09:00"], ret: ["10-02", "17:00"], days: 2, pickupLoc: 2 },
  { status: "no_show", payment: "paid", vehicle: 0, customer: 3, created: "10-12T17:25", pickup: ["10-15", "09:00"], ret: ["10-16", "17:00"], days: 1, pickupLoc: 0 },
  { status: "confirmed", payment: "paid", vehicle: 3, customer: 6, created: "10-23T08:30", pickup: ["10-31", "08:00"], ret: ["11-03", "18:00"], days: 3, pickupLoc: 0, addons: [helmet] },
];

export const bookings: Booking[] = seeds.map((seed, index) => {
  const person = customers[seed.customer];
  const created = ict(seed.created.slice(0, 5), seed.created.slice(6));
  const pickupAt = ict(seed.pickup[0], seed.pickup[1]);
  const returnAt = ict(seed.ret[0], seed.ret[1]);
  const reachedConfirmed = !["pending", "expired"].includes(seed.status);
  const reachedReady = ["ready_for_pickup", "active", "returned", "completed"].includes(seed.status);
  const reachedActive = ["active", "returned", "completed"].includes(seed.status);
  const reachedReturn = ["returned", "completed"].includes(seed.status);
  const odometer = 12_480 + index * 317;
  const handover: HandoverInspection | null = reachedActive ? {
    actualPickupAt: shift(pickupAt, 8), odometerKm: odometer, fuelLevel: "full", condition: "good",
    existingDamageNotes: index % 2 ? "No existing damage noted." : "Small cosmetic scratch on the left side panel.",
    photoNames: ["pickup-front.jpg", "pickup-odometer.jpg"], licenceVerified: true, identityVerified: true,
    depositVerified: true, staffNotes: "Vehicle controls and return procedure explained to the customer.",
  } : null;
  const returnInspection: ReturnInspection | null = reachedReturn ? {
    actualReturnAt: shift(returnAt, seed.damage ? 75 : -15), odometerKm: odometer + 186,
    fuelLevel: seed.damage ? "half" : "three_quarters", condition: seed.damage ? "needs_attention" : "good",
    newDamageFound: Boolean(seed.damage), damageNotes: seed.damage ? "New scrape on the right fairing; requires staff assessment." : "No new damage found.",
    photoNames: ["return-right.jpg", "return-odometer.jpg"], staffNotes: "Keys and vehicle received at the return counter.",
  } : null;
  return {
    reference: `BK-${String(index + 1).padStart(4, "0")}`, createdAt: created, status: seed.status, paymentStatus: seed.payment,
    customer: { id: person.id, reference: person.reference, name: person.name, phone: person.phone, email: person.email, city: person.city },
    vehicle: reachedActive ? { ...adminVehicles[seed.vehicle], status: seed.status === "completed" ? "available" : "rented" } : adminVehicles[seed.vehicle],
    pickupAt, returnAt, pickupLocation: adminLocations[seed.pickupLoc].name, returnLocation: adminLocations[seed.returnLoc ?? seed.pickupLoc].name,
    days: seed.days, addons: seed.addons ?? [], holdExpiresAt: seed.status === "pending" ? shift(created, 15) : null,
    confirmedAt: reachedConfirmed ? shift(created, 20) : null, readyAt: reachedReady ? shift(pickupAt, -60) : null,
    handover, returnInspection, completedAt: seed.status === "completed" ? shift(returnInspection?.actualReturnAt ?? returnAt, 30) : null,
    cancelledAt: seed.status === "cancelled" ? shift(created, 26 * 60) : null,
    cancelReason: seed.status === "cancelled" ? (index % 2 ? "Customer changed travel plans." : "Vehicle unavailable after inspection.") : null,
    expiredAt: seed.status === "expired" ? shift(created, 15) : null,
    noShowAt: seed.status === "no_show" ? shift(pickupAt, 90) : null,
  };
});

export const getBooking = (reference: string) => bookings.find((booking) => booking.reference.toLowerCase() === reference.toLowerCase());
export const isOverdue = (booking: Booking, now = NOW) => booking.status === "active" && Date.parse(booking.returnAt) < now;
export const distanceTravelled = (booking: Booking) => booking.handover && booking.returnInspection ? Math.max(0, booking.returnInspection.odometerKm - booking.handover.odometerKm) : null;
export const lateMinutes = (booking: Booking) => booking.returnInspection ? Math.max(0, Math.round((Date.parse(booking.returnInspection.actualReturnAt) - Date.parse(booking.returnAt)) / 60_000)) : isOverdue(booking) ? Math.max(0, Math.round((NOW - Date.parse(booking.returnAt)) / 60_000)) : 0;
export const durationLabel = (minutes: number) => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
export const ictLocalToIso = (value: string) => `${value.length === 16 ? `${value}:00` : value}+07:00`;
export const isoToIctLocal = (iso: string) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const fmt = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", ...options }).format(new Date(iso));
export const fmtDate = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) => fmt(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtShort = (iso: string) => fmt(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtTime = (iso: string) => fmt(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
