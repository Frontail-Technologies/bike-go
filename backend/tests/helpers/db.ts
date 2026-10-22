import { eq } from "drizzle-orm";
import { db } from "../../src/libs/db";
import { pgErrorCode } from "../../src/libs/db/errors";
import { bookings, vehicles } from "../../src/libs/db/schema";
import { newReference } from "../../src/libs/reference";

export async function vehicleBySlug(slug: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
  if (!row) throw new Error(`seed vehicle ${slug} missing`);
  return row;
}

type BookingStatus = "pending" | "confirmed" | "ready_for_pickup" | "active" | "completed" | "cancelled";

/** Inserts a booking row directly, bypassing the service, to set up availability scenarios. */
export async function insertBooking(options: { vehicleId: string; userId: string; pickupAt: string; returnAt: string; status?: BookingStatus }) {
  const vehicle = (await db.select().from(vehicles).where(eq(vehicles.id, options.vehicleId)).limit(1))[0]!;
  const [row] = await db
    .insert(bookings)
    .values({
      reference: newReference("RG"),
      userId: options.userId,
      vehicleId: options.vehicleId,
      pickupLocationId: vehicle.locationId,
      returnLocationId: vehicle.locationId,
      pickupAt: new Date(options.pickupAt),
      returnAt: new Date(options.returnAt),
      rentalDays: 1,
      currency: vehicle.currency,
      dailyRateSnapshotMinor: vehicle.dailyRentalPriceMinor,
      rentalSubtotalMinor: vehicle.dailyRentalPriceMinor,
      totalPayableMinor: vehicle.dailyRentalPriceMinor,
      bookingStatus: options.status ?? "confirmed",
    })
    .returning();
  return row!;
}

/** Runs a promise and returns the Postgres SQLSTATE it failed with, or undefined if it succeeded. */
export async function sqlstateOf(run: () => Promise<unknown>) {
  try {
    await run();
    return undefined;
  } catch (error) {
    return pgErrorCode(error);
  }
}

/** Removes vehicles (and their bookings) that tests created on top of the seed, so files do not affect each other. */
export async function cleanupExtraVehicles() {
  const { notInArray } = await import("drizzle-orm");
  const { seedVehicles } = await import("../../src/libs/db/seed");
  const extra = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(notInArray(vehicles.slug, seedVehicles.map((v) => v.slug)));
  for (const { id } of extra) {
    await db.delete(bookings).where(eq(bookings.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }
}
