import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { PG, pgErrorCode } from "@/libs/db/errors";
import { bookings, customerProfiles, user, vehicles } from "@/libs/db/schema";
import { paginate } from "@/libs/pagination";
import { expireStaleHolds } from "@/routes/booking/holds";
import { bookingViews } from "@/routes/booking/service";
import { assertBookingTransition, STAFF_BOOKING_TRANSITIONS } from "@/routes/booking/rules";
import type { BookingStatus } from "@/routes/booking/types";
import type { AdminBookingView, BookingStatusPatch, BookingsGet } from "./types";
import { lockRows } from "@/libs/db/lock";
import { idByReference } from "@/libs/db/lookup";
import { publicEmail } from "@/libs/identity";

async function adminViews(ids: string[]): Promise<AdminBookingView[]> {
  if (ids.length === 0) return [];
  const [views, owners] = await Promise.all([
    bookingViews(db, ids),
    db
      .select({ id: bookings.id, userId: user.id, name: user.name, email: user.email, profileEmail: customerProfiles.email, phone: customerProfiles.phone, profileName: customerProfiles.fullName })
      .from(bookings)
      .innerJoin(user, eq(user.id, bookings.userId))
      .leftJoin(customerProfiles, eq(customerProfiles.userId, bookings.userId))
      .where(inArray(bookings.id, ids)),
  ]);
  const byId = new Map(owners.map((o) => [o.id, o]));
  return views.map((view, i) => {
    const owner = byId.get(ids[i]!)!;
    const email = publicEmail(owner.profileEmail, owner.email);
    return { ...view, customer: { id: owner.userId, name: owner.profileName ?? owner.name, email, phone: owner.phone }, allowedNextStatuses: [...STAFF_BOOKING_TRANSITIONS[view.bookingStatus as BookingStatus]] };
  });
}

export async function adminGetBooking(reference: string) {
  await expireStaleHolds(db, { reference });
  return (await adminViews([await idByReference(bookings, reference, "Booking")]))[0]!;
}

export async function adminListBookings(query: BookingsGet["Query"]) {
  await expireStaleHolds(db);
  const search = query.q ? `%${query.q}%` : undefined;
  const where = and(
    query.status ? eq(bookings.bookingStatus, query.status) : undefined,
    query.paymentStatus ? eq(bookings.paymentStatus, query.paymentStatus) : undefined,
    query.vehicleId ? eq(bookings.vehicleId, query.vehicleId) : undefined,
    query.locationId ? eq(bookings.pickupLocationId, query.locationId) : undefined,
    query.pickupFrom ? gte(bookings.pickupAt, new Date(query.pickupFrom)) : undefined,
    query.pickupTo ? lt(bookings.pickupAt, new Date(query.pickupTo)) : undefined,
    search ? or(ilike(bookings.reference, search), ilike(user.name, search), ilike(user.email, search), ilike(vehicles.name, search)) : undefined,
  );
  const order = { newest: desc(bookings.createdAt), pickup_asc: asc(bookings.pickupAt), pickup_desc: desc(bookings.pickupAt), total_desc: desc(bookings.totalPayableMinor) }[query.sort ?? "newest"];

  return paginate(query, {
    rows: (page) =>
      db
        .select({ id: bookings.id })
        .from(bookings)
        .innerJoin(user, eq(user.id, bookings.userId))
        .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
        .where(where)
        .orderBy(order, asc(bookings.reference))
        .limit(page.limit)
        .offset(page.offset),
    total: () => db.select({ n: count() }).from(bookings).innerJoin(user, eq(user.id, bookings.userId)).innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId)).where(where),
    map: (rows) => adminViews(rows.map((r) => r.id)),
  });
}

export async function updateBookingStatus(reference: string, input: BookingStatusPatch["Body"]) {
  try {
    await db.transaction(async (tx) => {
      await lockRows(tx, bookings, eq(bookings.reference, reference));
      await expireStaleHolds(tx, { reference });
      const [current] = await tx.select().from(bookings).where(eq(bookings.reference, reference)).limit(1);
      if (!current) throw new AppError("NOT_FOUND", 404, "Booking not found.");

      const changes: Partial<typeof bookings.$inferInsert> = {};
      if (input.bookingStatus && input.bookingStatus !== current.bookingStatus) {
        assertBookingTransition(current.bookingStatus, input.bookingStatus);
        changes.bookingStatus = input.bookingStatus;
        if (current.bookingStatus === "pending") changes.holdExpiresAt = null;
        if (input.bookingStatus === "cancelled") {
          changes.cancelledAt = new Date();
          changes.cancellationReason = input.note ?? null;
        }
      }
      if (input.paymentStatus) changes.paymentStatus = input.paymentStatus;
      if (Object.keys(changes).length > 0) await tx.update(bookings).set(changes).where(eq(bookings.id, current.id));
    });
    return await adminGetBooking(reference);
  } catch (error) {
    if (pgErrorCode(error) === PG.exclusionViolation) throw new AppError("BOOKING_CONFLICT", 409, "Another booking already holds this vehicle for that period.");
    throw error;
  }
}
