import { and, asc, eq, exists, gt, inArray, lt, or, type SQL } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { BLOCKING_BOOKING_STATUSES, bookings, vehicleBlocks, vehicles } from "@/libs/db/schema";

export const UNRENTABLE_STATUSES = ["maintenance", "inactive"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function holdingCondition(now: Date = new Date()): SQL {
  return or(inArray(bookings.bookingStatus, [...BLOCKING_BOOKING_STATUSES]), and(eq(bookings.bookingStatus, "pending"), gt(bookings.holdExpiresAt, now)))!;
}

export function bookingOverlap(vehicleId: SQL | typeof vehicles.id, start: Date, end: Date, now: Date = new Date()) {
  return exists(
    db
      .select({ one: bookings.id })
      .from(bookings)
      .where(and(eq(bookings.vehicleId, vehicleId as typeof vehicles.id), holdingCondition(now), lt(bookings.pickupAt, end), gt(bookings.returnAt, start))),
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

export function assertInterval(start: Date, end: Date) {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new AppError("VALIDATION_ERROR", 422, "Dates must be valid ISO-8601 timestamps.");
  if (!(end > start)) throw new AppError("VALIDATION_ERROR", 422, "The end must be after the start.", [{ path: "to", message: "Must be after the start." }]);
}

export async function busyPeriods(executor: Executor, vehicleId: string, start: Date, end: Date, now: Date = new Date()) {
  const [held, blocked] = await Promise.all([
    executor
      .select({ start: bookings.pickupAt, end: bookings.returnAt, status: bookings.bookingStatus })
      .from(bookings)
      .where(and(eq(bookings.vehicleId, vehicleId), holdingCondition(now), lt(bookings.pickupAt, end), gt(bookings.returnAt, start)))
      .orderBy(asc(bookings.pickupAt)),
    executor
      .select({ start: vehicleBlocks.startAt, end: vehicleBlocks.endAt })
      .from(vehicleBlocks)
      .where(and(eq(vehicleBlocks.vehicleId, vehicleId), lt(vehicleBlocks.startAt, end), gt(vehicleBlocks.endAt, start)))
      .orderBy(asc(vehicleBlocks.startAt)),
  ]);
  return [
    ...held.map((p) => ({ start: p.start, end: p.end, kind: "booking" as const, hold: p.status === "pending" })),
    ...blocked.map((p) => ({ ...p, kind: "block" as const, hold: false })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());
}

export type Availability = {
  vehicleId: string;
  from: string;
  to: string;
  bookable: boolean;
  reason: "vehicle_unavailable" | "period_taken" | null;
  unavailablePeriods: { start: string; end: string; kind: "booking" | "block" }[];
};

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

export async function resolveVehicleId(idOrSlug: string) {
  const key = UUID.test(idOrSlug) ? eq(vehicles.id, idOrSlug) : eq(vehicles.slug, idOrSlug);
  const [row] = await db.select({ id: vehicles.id, status: vehicles.status }).from(vehicles).where(key).limit(1);
  if (!row || row.status === "inactive") throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  return row.id;
}
