import { eq, notInArray } from "drizzle-orm";
import { db } from "../../src/libs/db";
import { pgErrorCode } from "../../src/libs/db/errors";
import { bookings, vehicles } from "../../src/libs/db/schema";
import { seedVehicles } from "../../src/libs/db/seed";
import { newReference } from "../../src/libs/reference";

export async function vehicleBySlug(slug: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
  if (!row) throw new Error(`seed vehicle ${slug} missing`);
  return row;
}

type BookingStatus = "pending" | "confirmed" | "ready_for_pickup" | "active" | "completed" | "cancelled" | "expired";

export async function insertBooking(options: { vehicleId: string; userId: string; pickupAt: string; returnAt: string; status?: BookingStatus; holdExpiresAt?: Date | null | undefined }) {
  const vehicle = (await db.select().from(vehicles).where(eq(vehicles.id, options.vehicleId)).limit(1))[0]!;
  const status = options.status ?? "confirmed";
  const holdExpiresAt = options.holdExpiresAt !== undefined ? options.holdExpiresAt : status === "pending" ? new Date(Date.now() + 15 * 60_000) : null;
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
      bookingStatus: status,
      holdExpiresAt,
    })
    .returning();
  return row!;
}

export async function sqlstateOf(run: () => Promise<unknown>) {
  try {
    await run();
    return undefined;
  } catch (error) {
    return pgErrorCode(error);
  }
}

export async function cleanupExtraVehicles() {
  const extra = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(notInArray(vehicles.slug, seedVehicles.map((v) => v.slug)));
  for (const { id } of extra) {
    await db.delete(bookings).where(eq(bookings.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }
}
