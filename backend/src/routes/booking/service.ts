import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { env } from "@/env";
import { AppError } from "@/libs/api";
import { rentalDays } from "@/libs/date";
import { db, rowsOf, type Executor, type Tx } from "@/libs/db";
import { PG, pgErrorCode } from "@/libs/db/errors";
import { bookingAddonItems, bookingAddons, bookings, locations, vehicles } from "@/libs/db/schema";
import { idempotently } from "@/libs/idempotency";
import type { Currency } from "@/libs/money";
import { pageMeta, pageOf } from "@/libs/pagination";
import { newReference } from "@/libs/reference";
import { busyPeriods, UNRENTABLE_STATUSES } from "../availability/service";
import type { BookingRequest, BookingsGet, BookingView, QuoteView } from "./model";
import { priceBooking } from "./pricing";

/** Booking rules that are policy, not pricing. */
export const MAX_RENTAL_DAYS = 90;
/** Customers may submit a pickup a few minutes in the past (clock drift, slow forms). */
const PICKUP_SKEW_MS = 5 * 60 * 1000;
const CANCELLABLE = ["pending", "confirmed", "ready_for_pickup"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalid = (path: string, message: string) => new AppError("VALIDATION_ERROR", 422, message, [{ path, message }]);

const platformFee = (currency: Currency) => (currency === "KHR" ? env.PLATFORM_FEE_KHR_MINOR : env.PLATFORM_FEE_MINOR);

// ------------------------------------------------------------------ quoting

type Prepared = {
  vehicle: typeof vehicles.$inferSelect;
  pickupLocationId: string;
  returnLocationId: string;
  pickupAt: Date;
  returnAt: Date;
  days: number;
  pricing: ReturnType<typeof priceBooking>;
  addonCodes: Map<string, string>;
};

/**
 * Validates a request and prices it from the database's current prices. Used by the quote endpoint and, inside the
 * transaction, by booking creation, so a quote and a booking are always computed the same way.
 */
async function prepare(executor: Executor, request: BookingRequest, options: { forUpdate: boolean }): Promise<Prepared> {
  const pickupAt = new Date(request.pickupAt);
  const returnAt = new Date(request.returnAt);
  if (!(returnAt > pickupAt)) throw invalid("returnAt", "The return must be after the pickup.");
  if (pickupAt.getTime() < Date.now() - PICKUP_SKEW_MS) throw invalid("pickupAt", "The pickup cannot be in the past.");
  const days = rentalDays(pickupAt, returnAt);
  if (days > MAX_RENTAL_DAYS) throw invalid("returnAt", `Rentals are limited to ${MAX_RENTAL_DAYS} days.`);

  const key = UUID.test(request.vehicle) ? eq(vehicles.id, request.vehicle) : eq(vehicles.slug, request.vehicle);
  const [found] = await executor.select({ id: vehicles.id }).from(vehicles).where(key).limit(1);
  if (!found) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

  // Booking creation locks the vehicle row so concurrent requests for it queue up behind this one.
  if (options.forUpdate) {
    const locked = rowsOf<{ id: string }>(await executor.execute(sql`select id from ${vehicles} where ${vehicles.id} = ${found.id} for update`));
    if (locked.length === 0) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  }
  const vehicle = (await executor.select().from(vehicles).where(eq(vehicles.id, found.id)).limit(1))[0]!;

  if ((UNRENTABLE_STATUSES as readonly string[]).includes(vehicle.status)) {
    throw new AppError("VEHICLE_UNAVAILABLE", 409, "This vehicle cannot be rented right now.");
  }

  const pickupLocationId = request.pickupLocationId ?? vehicle.locationId;
  const returnLocationId = request.returnLocationId ?? pickupLocationId;
  if (pickupLocationId !== vehicle.locationId) throw invalid("pickupLocationId", "This vehicle is not at that location.");
  const places = await executor.select({ id: locations.id, active: locations.active }).from(locations).where(inArray(locations.id, [...new Set([pickupLocationId, returnLocationId])]));
  for (const [path, id] of [["pickupLocationId", pickupLocationId], ["returnLocationId", returnLocationId]] as const) {
    const place = places.find((p) => p.id === id);
    if (!place || !place.active) throw invalid(path, "That location is not available.");
  }

  const wanted = new Map<string, number>();
  for (const { code, quantity } of request.addons ?? []) wanted.set(code, (wanted.get(code) ?? 0) + (quantity ?? 1));
  const addonRows = wanted.size ? await executor.select().from(bookingAddons).where(and(inArray(bookingAddons.code, [...wanted.keys()]), eq(bookingAddons.active, true))) : [];
  for (const code of wanted.keys()) {
    if (!addonRows.some((a) => a.code === code)) throw invalid("addons", `Unknown or unavailable add-on "${code}".`);
  }
  if (addonRows.some((a) => a.currency !== vehicle.currency)) throw invalid("addons", "Add-ons must be priced in the vehicle's currency.");

  const pricing = priceBooking({
    currency: vehicle.currency,
    days,
    dailyRateMinor: vehicle.dailyRentalPriceMinor,
    securityDepositMinor: vehicle.securityDepositMinor,
    addons: addonRows.map((a) => ({ addonId: a.id, name: a.name, unitPriceMinor: a.pricePerDayMinor, quantity: wanted.get(a.code)! })),
    taxRateBps: env.TAX_RATE_BPS,
    platformFeeMinor: platformFee(vehicle.currency),
  });

  return { vehicle, pickupLocationId, returnLocationId, pickupAt, returnAt, days, pricing, addonCodes: new Map(addonRows.map((a) => [a.id, a.code])) };
}

const quoteView = (prepared: Prepared): QuoteView => ({
  currency: prepared.pricing.currency,
  rentalDays: prepared.days,
  pricing: pricingView(prepared.pricing),
  addons: prepared.pricing.addons.map((a) => ({ code: prepared.addonCodes.get(a.addonId) ?? null, name: a.name, unitPriceMinor: a.unitPriceMinor, quantity: a.quantity, days: a.days, totalMinor: a.totalMinor })),
});

/** A price preview. Nothing is stored and availability is not claimed. */
export async function quote(request: BookingRequest) {
  return quoteView(await prepare(db, request, { forUpdate: false }));
}

const pricingView = (p: ReturnType<typeof priceBooking>) => ({
  dailyRateMinor: p.dailyRateMinor,
  rentalSubtotalMinor: p.rentalSubtotalMinor,
  addonsTotalMinor: p.addonsTotalMinor,
  platformFeeMinor: p.platformFeeMinor,
  taxesMinor: p.taxesMinor,
  securityDepositMinor: p.securityDepositMinor,
  totalPayableMinor: p.totalPayableMinor,
});

// ------------------------------------------------------------------ creating

async function insertBooking(tx: Tx, userId: string, p: Prepared) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const [created] = await tx
      .insert(bookings)
      .values({
        reference: newReference("RG"),
        userId,
        vehicleId: p.vehicle.id,
        pickupLocationId: p.pickupLocationId,
        returnLocationId: p.returnLocationId,
        pickupAt: p.pickupAt,
        returnAt: p.returnAt,
        rentalDays: p.days,
        currency: p.pricing.currency,
        dailyRateSnapshotMinor: p.pricing.dailyRateMinor,
        rentalSubtotalMinor: p.pricing.rentalSubtotalMinor,
        addonsTotalMinor: p.pricing.addonsTotalMinor,
        platformFeeMinor: p.pricing.platformFeeMinor,
        securityDepositSnapshotMinor: p.pricing.securityDepositMinor,
        taxesMinor: p.pricing.taxesMinor,
        totalPayableMinor: p.pricing.totalPayableMinor,
        // Payment is deferred (no ABA yet): the booking holds the vehicle as confirmed-but-unpaid.
        bookingStatus: "confirmed",
        paymentStatus: "unpaid",
      })
      .onConflictDoNothing({ target: bookings.reference })
      .returning();
    if (created) return created;
  }
  throw new AppError("INTERNAL_ERROR", 500, "Could not allocate a booking reference. Please try again.");
}

/**
 * Creates a booking. Inside one transaction: lock the vehicle row, re-check status and the period against holding
 * bookings and blocks, price from current database values, insert. The exclusion constraint in the database is the
 * backstop if anything ever slips past those checks.
 */
export async function createBooking(userId: string, request: BookingRequest, idempotencyKey: string | undefined) {
  try {
    const result = await idempotently<BookingView>({ scope: `booking:create:${userId}`, key: idempotencyKey, userId, payload: request }, async (tx) => {
      const prepared = await prepare(tx, request, { forUpdate: true });

      const taken = await busyPeriods(tx, prepared.vehicle.id, prepared.pickupAt, prepared.returnAt);
      if (taken.length > 0) throw new AppError("BOOKING_CONFLICT", 409, "This vehicle is not available for the selected period.");

      const created = await insertBooking(tx, userId, prepared);
      if (prepared.pricing.addons.length > 0) {
        await tx.insert(bookingAddonItems).values(
          prepared.pricing.addons.map((a) => ({
            bookingId: created.id,
            addonId: a.addonId,
            nameSnapshot: a.name,
            unitPriceSnapshotMinor: a.unitPriceMinor,
            currency: prepared.pricing.currency,
            quantity: a.quantity,
            days: a.days,
            totalMinor: a.totalMinor,
          })),
        );
      }
      return { status: 201, body: await bookingView(tx, created.id) };
    });
    return result;
  } catch (error) {
    // Two requests that raced past every check: the database refuses the second.
    if (pgErrorCode(error) === PG.exclusionViolation) throw new AppError("BOOKING_CONFLICT", 409, "This vehicle is not available for the selected period.");
    throw error;
  }
}

// ------------------------------------------------------------------ reading

async function bookingViews(executor: Executor, ids: string[]): Promise<BookingView[]> {
  if (ids.length === 0) return [];
  const rows = await executor.query.bookings.findMany({
    where: inArray(bookings.id, ids),
    with: { vehicle: true, pickupLocation: true, returnLocation: true, addonItems: { with: { addon: true } } },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => {
    const row = byId.get(id)!;
    const place = (l: typeof row.pickupLocation) => ({ id: l.id, name: l.name, city: l.city, address: l.address });
    return {
      reference: row.reference,
      bookingStatus: row.bookingStatus,
      paymentStatus: row.paymentStatus,
      vehicle: { id: row.vehicle.id, slug: row.vehicle.slug, name: row.vehicle.name, brand: row.vehicle.brand, model: row.vehicle.model },
      pickupLocation: place(row.pickupLocation),
      returnLocation: place(row.returnLocation),
      pickupAt: row.pickupAt.toISOString(),
      returnAt: row.returnAt.toISOString(),
      rentalDays: row.rentalDays,
      currency: row.currency,
      pricing: {
        dailyRateMinor: row.dailyRateSnapshotMinor,
        rentalSubtotalMinor: row.rentalSubtotalMinor,
        addonsTotalMinor: row.addonsTotalMinor,
        platformFeeMinor: row.platformFeeMinor,
        taxesMinor: row.taxesMinor,
        securityDepositMinor: row.securityDepositSnapshotMinor,
        totalPayableMinor: row.totalPayableMinor,
      },
      addons: row.addonItems.map((item) => ({ code: item.addon.code, name: item.nameSnapshot, unitPriceMinor: item.unitPriceSnapshotMinor, quantity: item.quantity, days: item.days, totalMinor: item.totalMinor })),
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      cancellationReason: row.cancellationReason,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function bookingView(executor: Executor, id: string) {
  return (await bookingViews(executor, [id]))[0]!;
}

export async function listMyBookings(userId: string, query: BookingsGet["Query"]) {
  const paging = pageOf(query);
  const where = and(eq(bookings.userId, userId), query.status ? eq(bookings.bookingStatus, query.status) : undefined);
  const [ids, [total]] = await Promise.all([
    db.select({ id: bookings.id }).from(bookings).where(where).orderBy(desc(bookings.createdAt), asc(bookings.reference)).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(bookings).where(where),
  ]);
  return { data: await bookingViews(db, ids.map((r) => r.id)), meta: pageMeta(paging, total?.n ?? 0) };
}

/** A customer's own booking. Someone else's reference looks exactly like one that does not exist. */
export async function getMyBooking(userId: string, reference: string) {
  const [row] = await db.select({ id: bookings.id }).from(bookings).where(and(eq(bookings.reference, reference), eq(bookings.userId, userId))).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Booking not found.");
  return bookingView(db, row.id);
}

// ------------------------------------------------------------------ cancelling

export async function cancelMyBooking(userId: string, reference: string, reason: string | undefined) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(bookings).where(and(eq(bookings.reference, reference), eq(bookings.userId, userId))).limit(1);
    if (!row) throw new AppError("NOT_FOUND", 404, "Booking not found.");
    if (row.bookingStatus === "cancelled") return bookingView(tx, row.id); // already cancelled: cancelling twice is harmless
    if (!(CANCELLABLE as readonly string[]).includes(row.bookingStatus)) {
      throw new AppError("INVALID_BOOKING_STATUS", 409, `A booking that is ${row.bookingStatus.replaceAll("_", " ")} cannot be cancelled.`);
    }
    await tx
      .update(bookings)
      .set({ bookingStatus: "cancelled", cancelledAt: new Date(), cancellationReason: reason ?? null, paymentStatus: row.paymentStatus === "paid" ? "refunded" : row.paymentStatus })
      .where(eq(bookings.id, row.id));
    return bookingView(tx, row.id);
  });
}
