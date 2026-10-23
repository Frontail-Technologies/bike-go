import { and, asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { env } from "@/env";
import { AppError, invalid } from "@/libs/api";
import { rentalDays } from "@/libs/date";
import { db } from "@/libs/db";
import { alias } from "drizzle-orm/pg-core";
import { PG, pgErrorCode } from "@/libs/db/errors";
import { bookingAddonItems, bookingAddons, bookings, locations, vehicles } from "@/libs/db/schema";
import { idempotently } from "@/libs/idempotency";
import { paginate } from "@/libs/pagination";
import { newReference } from "@/libs/reference";
import { busyPeriods, UNRENTABLE_STATUSES } from "../availability/service";
import { effectiveBookingStatus, expireStaleHolds, withLapsedHold } from "./holds";
import { priceBooking } from "./pricing";
import type { Executor, Tx } from "@/libs/db/types";
import type { Currency } from "@/libs/types";
import type { BookingRequest, BookingView, BookingsGet, QuoteView } from "./types";
import { matchIdOrSlug } from "@/libs/uuid";
import type { PreparedBooking } from "./types";

export const MAX_RENTAL_DAYS = 90;
const PICKUP_SKEW_MS = 5 * 60 * 1000;
const CANCELLABLE = ["pending", "confirmed", "ready_for_pickup"] as const;


const platformFee = (currency: Currency) => (currency === "KHR" ? env.PLATFORM_FEE_KHR_MINOR : env.PLATFORM_FEE_USD_MINOR);

async function prepare(executor: Executor, request: BookingRequest, options: { forUpdate: boolean }): Promise<PreparedBooking> {
  const pickupAt = new Date(request.pickupAt);
  const returnAt = new Date(request.returnAt);
  if (!(returnAt > pickupAt)) throw invalid("returnAt", "The return must be after the pickup.");
  if (pickupAt.getTime() < Date.now() - PICKUP_SKEW_MS) throw invalid("pickupAt", "The pickup cannot be in the past.");
  const days = rentalDays(pickupAt, returnAt);
  if (days > MAX_RENTAL_DAYS) throw invalid("returnAt", `Rentals are limited to ${MAX_RENTAL_DAYS} days.`);

  const lookup = executor.select().from(vehicles).where(matchIdOrSlug(vehicles.id, vehicles.slug, request.vehicle)).limit(1);
  const [vehicle] = await (options.forUpdate ? lookup.for("update") : lookup);
  if (!vehicle) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

  if ((UNRENTABLE_STATUSES as readonly string[]).includes(vehicle.status)) {
    throw new AppError("VEHICLE_UNAVAILABLE", 409, "This vehicle cannot be rented right now.");
  }

  const pickupLocationId = request.pickupLocationId ?? vehicle.locationId;
  const returnLocationId = request.returnLocationId ?? pickupLocationId;
  if (pickupLocationId !== vehicle.locationId) throw invalid("pickupLocationId", "This vehicle is not at that location.");
  const wanted = new Map<string, number>();
  for (const { code, quantity } of request.addons ?? []) wanted.set(code, (wanted.get(code) ?? 0) + (quantity ?? 1));

  const [places, addonRows] = await Promise.all([
    executor.select({ id: locations.id, active: locations.active }).from(locations).where(inArray(locations.id, [...new Set([pickupLocationId, returnLocationId])])),
    wanted.size ? executor.select().from(bookingAddons).where(and(inArray(bookingAddons.code, [...wanted.keys()]), eq(bookingAddons.active, true))) : Promise.resolve([]),
  ]);
  for (const [path, id] of [["pickupLocationId", pickupLocationId], ["returnLocationId", returnLocationId]] as const) {
    const place = places.find((p) => p.id === id);
    if (!place || !place.active) throw invalid(path, "That location is not available.");
  }
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
    taxRateBps: env.VAT_RATE_BPS,
    platformFeeMinor: platformFee(vehicle.currency),
  });

  return { vehicle, pickupLocationId, returnLocationId, pickupAt, returnAt, days, pricing, addonCodes: new Map(addonRows.map((a) => [a.id, a.code])) };
}

const quoteView = (prepared: PreparedBooking): QuoteView => ({
  currency: prepared.pricing.currency,
  rentalDays: prepared.days,
  pricing: pricingView(prepared.pricing),
  addons: prepared.pricing.addons.map((a) => ({ code: prepared.addonCodes.get(a.addonId) ?? null, name: a.name, unitPriceMinor: a.unitPriceMinor, quantity: a.quantity, days: a.days, totalMinor: a.totalMinor })),
});

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

async function insertBooking(tx: Tx, userId: string, p: PreparedBooking) {
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
        bookingStatus: "pending",
        paymentStatus: "unpaid",
        holdExpiresAt: new Date(Date.now() + env.BOOKING_HOLD_MINUTES * 60_000),
      })
      .onConflictDoNothing({ target: bookings.reference })
      .returning();
    if (created) return created;
  }
  throw new AppError("INTERNAL_ERROR", 500, "Could not allocate a booking reference. Please try again.");
}

export async function createBooking(userId: string, request: BookingRequest, idempotencyKey: string | undefined) {
  try {
    const result = await idempotently<BookingView>({ scope: `booking:create:${userId}`, key: idempotencyKey, userId, payload: request }, async (tx) => {
      const prepared = await prepare(tx, request, { forUpdate: true });

      await expireStaleHolds(tx, { vehicleId: prepared.vehicle.id });
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
    if (pgErrorCode(error) === PG.exclusionViolation) throw new AppError("BOOKING_CONFLICT", 409, "This vehicle is not available for the selected period.");
    throw error;
  }
}

const pickupLocation = alias(locations, "pickup_location");
const returnLocation = alias(locations, "return_location");

async function loadBookings(executor: Executor, where: SQL) {
  const [rows, items] = await Promise.all([
    executor
      .select({ booking: bookings, vehicle: vehicles, pickup: pickupLocation, back: returnLocation })
      .from(bookings)
      .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
      .innerJoin(pickupLocation, eq(pickupLocation.id, bookings.pickupLocationId))
      .innerJoin(returnLocation, eq(returnLocation.id, bookings.returnLocationId))
      .where(where),
    executor
      .select({ item: bookingAddonItems, code: bookingAddons.code })
      .from(bookingAddonItems)
      .innerJoin(bookingAddons, eq(bookingAddons.id, bookingAddonItems.addonId))
      .where(inArray(bookingAddonItems.bookingId, executor.select({ id: bookings.id }).from(bookings).where(where))),
  ]);
  return rows.map((row) => ({ ...row, items: items.filter((entry) => entry.item.bookingId === row.booking.id) }));
}

type LoadedBooking = Awaited<ReturnType<typeof loadBookings>>[number];

function presentBooking({ booking: row, vehicle, pickup, back, items }: LoadedBooking, now: Date): BookingView {
  const place = (l: typeof pickup) => ({ id: l.id, name: l.name, city: l.city, address: l.address });
  return {
    reference: row.reference,
    bookingStatus: withLapsedHold(row, now),
    paymentStatus: row.paymentStatus,
    vehicle: { id: vehicle.id, slug: vehicle.slug, name: vehicle.name, brand: vehicle.brand, model: vehicle.model },
    pickupLocation: place(pickup),
    returnLocation: place(back),
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
    addons: items.map(({ item, code }) => ({ code, name: item.nameSnapshot, unitPriceMinor: item.unitPriceSnapshotMinor, quantity: item.quantity, days: item.days, totalMinor: item.totalMinor })),
    holdExpiresAt: row.holdExpiresAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function bookingViews(executor: Executor, ids: string[]): Promise<BookingView[]> {
  if (ids.length === 0) return [];
  const rows = await loadBookings(executor, inArray(bookings.id, ids));
  const byId = new Map(rows.map((row) => [row.booking.id, row]));
  const now = new Date();
  return ids.map((id) => presentBooking(byId.get(id)!, now));
}

export async function bookingView(executor: Executor, id: string) {
  return (await bookingViews(executor, [id]))[0]!;
}

export async function listMyBookings(userId: string, query: BookingsGet["Query"]) {
  const where = and(eq(bookings.userId, userId), query.status ? eq(effectiveBookingStatus, query.status) : undefined);
  return paginate(query, {
    rows: (page) => db.select({ id: bookings.id }).from(bookings).where(where).orderBy(desc(bookings.createdAt), asc(bookings.reference)).limit(page.limit).offset(page.offset),
    total: () => db.select({ n: count() }).from(bookings).where(where),
    map: (rows) => bookingViews(db, rows.map((r) => r.id)),
  });
}

export async function getMyBooking(userId: string, reference: string) {
  const [row] = await loadBookings(db, and(eq(bookings.reference, reference), eq(bookings.userId, userId))!);
  if (!row) throw new AppError("NOT_FOUND", 404, "Booking not found.");
  return presentBooking(row, new Date());
}

export async function cancelMyBooking(userId: string, reference: string, reason: string | undefined) {
  return db.transaction(async (tx) => {
    await expireStaleHolds(tx, { userId, reference });
    const [row] = await tx.select().from(bookings).where(and(eq(bookings.reference, reference), eq(bookings.userId, userId))).limit(1);
    if (!row) throw new AppError("NOT_FOUND", 404, "Booking not found.");
    if (row.bookingStatus === "cancelled") return bookingView(tx, row.id);
    if (!(CANCELLABLE as readonly string[]).includes(row.bookingStatus)) {
      throw new AppError("INVALID_BOOKING_STATUS", 409, `A booking that is ${row.bookingStatus.replaceAll("_", " ")} cannot be cancelled.`);
    }
    await tx
      .update(bookings)
      .set({ bookingStatus: "cancelled", holdExpiresAt: null, cancelledAt: new Date(), cancellationReason: reason ?? null })
      .where(eq(bookings.id, row.id));
    return bookingView(tx, row.id);
  });
}
