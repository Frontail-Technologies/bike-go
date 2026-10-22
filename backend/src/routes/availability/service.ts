import { and, asc, eq, exists, gt, inArray, lt, type SQL } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { BLOCKING_BOOKING_STATUSES, bookings, vehicleBlocks, vehicles } from "@/libs/db/schema";

/** Operational states a vehicle cannot be rented in, whatever its calendar looks like. */
export const UNRENTABLE_STATUSES = ["maintenance", "inactive"] as const;

/**
 * SQL conditions: "this vehicle has a holding booking / a block overlapping [start, end)". Periods are
 * half-open, so a rental may start the instant another ends. Pass the outer query's `vehicles.id` to filter a list.
 */
export function bookingOverlap(vehicleId: SQL | typeof vehicles.id, start: Date, end: Date) {
  return exists(
    db
      .select({ one: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.vehicleId, vehicleId as typeof vehicles.id), inArray(bookings.bookingStatus, [...BLOCKING_BOOKING_STATUSES]), lt(bookings.pickupAt, end), gt(bookings.returnAt, start))),
  );
}

export function blockOverlap(vehicleId: SQL | typeof vehicles.id, start: Date, end: Date) {
  return exists(
    db
      .select({ one: vehicleBlocks.id })
      .from(vehicleBlocks)
      .where(and(eq(vehicleBlocks.vehicleId, vehicleId as typeof vehicles.id), lt(vehicleBlocks.startAt, end), gt(vehicleBlocks.endAt, start))),
  );
}

export type Interval = { start: Date; end: Date };

export function assertInterval(start: Date, end: Date) {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new AppError("VALIDATION_ERROR", 422, "Dates must be valid ISO-8601 timestamps.");
  if (!(end > start)) throw new AppError("VALIDATION_ERROR", 422, "The end must be after the start.", [{ path: "to", message: "Must be after the start." }]);
}

/** Periods in [start, end) during which the vehicle is held by a booking or a block. Booking details are not exposed. */
export async function busyPeriods(executor: Executor, vehicleId: string, start: Date, end: Date) {
  const [held, blocked] = await Promise.all([
    executor
      .select({ start: bookings.pickupAt, end: bookings.returnAt })
      .from(bookings)
      .where(and(eq(bookings.vehicleId, vehicleId), inArray(bookings.bookingStatus, [...BLOCKING_BOOKING_STATUSES]), lt(bookings.pickupAt, end), gt(bookings.returnAt, start)))
      .orderBy(asc(bookings.pickupAt)),
    executor
      .select({ start: vehicleBlocks.startAt, end: vehicleBlocks.endAt })
      .from(vehicleBlocks)
      .where(and(eq(vehicleBlocks.vehicleId, vehicleId), lt(vehicleBlocks.startAt, end), gt(vehicleBlocks.endAt, start)))
      .orderBy(asc(vehicleBlocks.startAt)),
  ]);
  return [
    ...held.map((p) => ({ ...p, kind: "booking" as const })),
    ...blocked.map((p) => ({ ...p, kind: "block" as const })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type Availability = {
  vehicleId: string;
  from: string;
  to: string;
  bookable: boolean;
  /** Why the vehicle cannot be booked at all (status), or that the period is taken. Null when free. */
  reason: "vehicle_unavailable" | "period_taken" | null;
  unavailablePeriods: { start: string; end: string; kind: "booking" | "block" }[];
};

/** Whether [from, to) is free for the vehicle, and which periods inside the window are taken. */
export async function getAvailability(vehicleId: string, from: Date, to: Date): Promise<Availability> {
  assertInterval(from, to);
  const [vehicle] = await db.select({ id: vehicles.id, status: vehicles.status }).from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  if (!vehicle) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

  const periods = await busyPeriods(db, vehicleId, from, to);
  const unrentable = (UNRENTABLE_STATUSES as readonly string[]).includes(vehicle.status);
  return {
    vehicleId,
    from: from.toISOString(),
    to: to.toISOString(),
    bookable: !unrentable && periods.length === 0,
    reason: unrentable ? "vehicle_unavailable" : periods.length > 0 ? "period_taken" : null,
    unavailablePeriods: periods.map((p) => ({ start: p.start.toISOString(), end: p.end.toISOString(), kind: p.kind })),
  };
}
