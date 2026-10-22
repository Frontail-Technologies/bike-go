import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { bookings, vehicles } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { priceBooking } from "../src/routes/booking/pricing";
import { json } from "./helpers/http";
import { postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles, insertBooking, vehicleBySlug } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

let nextYear = 2060;
const window = (days = 3) => {
  const y = nextYear++;
  return { pickupAt: `${y}-03-10T10:00:00.000Z`, returnAt: `${y}-03-${10 + days}T10:00:00.000Z`, y };
};

const book = (cookie: string, body: Record<string, unknown>, key?: string) => postJson("/api/v1/bookings", body, { cookie, headers: key ? { "idempotency-key": key } : {} });

describe("pricing (pure)", () => {
  const base = { currency: "USD" as const, days: 3, dailyRateMinor: 2500, securityDepositMinor: 30000, taxRateBps: 1000, platformFeeMinor: 0 };

  test("adds rental, add-ons, fee, taxes and deposit exactly", () => {
    const result = priceBooking({
      ...base,
      platformFeeMinor: 100,
      addons: [
        { addonId: "h", name: "Helmet", unitPriceMinor: 200, quantity: 1 },
        { addonId: "j", name: "Riding jacket", unitPriceMinor: 200, quantity: 1 },
      ],
    });
    expect(result.rentalSubtotalMinor).toBe(7500);
    expect(result.addonsTotalMinor).toBe(1200);
    expect(result.taxesMinor).toBe(870);
    expect(result.platformFeeMinor).toBe(100);
    expect(result.totalPayableMinor).toBe(7500 + 1200 + 100 + 870 + 30000);
  });

  test("a zero platform fee adds nothing", () => {
    const result = priceBooking({ ...base, days: 1, addons: [] });
    expect(result.platformFeeMinor).toBe(0);
    expect(result.totalPayableMinor).toBe(2500 + 250 + 30000);
    expect(result.addons).toEqual([]);
  });

  test("quantity multiplies the add-on, and taxes round half up", () => {
    const result = priceBooking({ ...base, days: 2, taxRateBps: 1050, addons: [{ addonId: "h", name: "Helmet", unitPriceMinor: 333, quantity: 2 }] });
    expect(result.addons[0]?.totalMinor).toBe(333 * 2 * 2);
    expect(result.taxesMinor).toBe(Math.round(((2500 * 2 + 1332) * 1050) / 10000));
  });

  test("the tax rate is an input, not a constant", () => {
    expect(priceBooking({ ...base, taxRateBps: 0, addons: [] }).taxesMinor).toBe(0);
    expect(priceBooking({ ...base, taxRateBps: 1000, addons: [] }).taxesMinor).toBe(750);
    expect(priceBooking({ ...base, taxRateBps: 2000, addons: [] }).taxesMinor).toBe(1500);
  });
});

describe("creating a booking", () => {
  test("creates a pending, unpaid booking with a hold and a server-side price snapshot", async () => {
    const { cookie } = await signInCustomer();
    const w = window(3);
    const before = Date.now();
    const response = await book(cookie, { vehicle: "royal-enfield-classic-350", pickupAt: w.pickupAt, returnAt: w.returnAt, addons: [{ code: "helmet" }, { code: "riding-jacket" }] });
    expect(response.status).toBe(201);
    const booking = (await json(response)).data;
    expect(booking.reference).toMatch(/^RG\d{8}$/);
    expect(booking).toMatchObject({ bookingStatus: "pending", paymentStatus: "unpaid", rentalDays: 3, currency: "USD", vehicle: { slug: "royal-enfield-classic-350" } });
    const hold = new Date(booking.holdExpiresAt).getTime();
    expect(hold).toBeGreaterThan(before + 14 * 60_000);
    expect(hold).toBeLessThan(Date.now() + 16 * 60_000);
    expect(booking.pricing).toEqual({
      dailyRateMinor: 2500,
      rentalSubtotalMinor: 7500,
      addonsTotalMinor: 1200,
      platformFeeMinor: 0,
      taxesMinor: 870,
      securityDepositMinor: 30000,
      totalPayableMinor: 39570,
    });
    expect(booking.addons.map((a: { code: string }) => a.code).sort()).toEqual(["helmet", "riding-jacket"]);
  });

  test("totals, prices and status sent by the client are ignored", async () => {
    const { cookie } = await signInCustomer();
    const w = window(2);
    const response = await book(cookie, {
      vehicle: "yamaha-mt-15",
      pickupAt: w.pickupAt,
      returnAt: w.returnAt,
      totalPayableMinor: 1,
      rentalSubtotalMinor: 1,
      dailyRateMinor: 1,
      securityDepositMinor: 0,
      taxesMinor: 0,
      bookingStatus: "completed",
      paymentStatus: "paid",
      holdExpiresAt: "2099-01-01T00:00:00Z",
    });
    expect(response.status).toBe(201);
    const booking = (await json(response)).data;
    expect(booking.pricing.dailyRateMinor).toBe(2000);
    expect(booking.pricing.totalPayableMinor).toBe(2000 * 2 + 400 + 20000);
    expect(booking).toMatchObject({ bookingStatus: "pending", paymentStatus: "unpaid" });
    expect(new Date(booking.holdExpiresAt).getFullYear()).toBeLessThan(2099);
  });

  test("later price changes never rewrite an existing booking", async () => {
    const { cookie } = await signInCustomer();
    const w = window(2);
    const created = (await json(await book(cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt }))).data;
    const bike = await vehicleBySlug("ktm-duke-200");
    await db.update(vehicles).set({ dailyRentalPriceMinor: 9999, securityDepositMinor: 99999 }).where(eq(vehicles.id, bike.id));
    try {
      const reread = (await json(await request(`/api/v1/bookings/${created.reference}`, { cookie }))).data;
      expect(reread.pricing).toEqual(created.pricing);
      expect(reread.pricing.dailyRateMinor).toBe(2500);
    } finally {
      await db.update(vehicles).set({ dailyRentalPriceMinor: bike.dailyRentalPriceMinor, securityDepositMinor: bike.securityDepositMinor }).where(eq(vehicles.id, bike.id));
    }
  });

  test("the quote endpoint prices exactly like the booking, without creating one", async () => {
    const { cookie } = await signInCustomer();
    const w = window(3);
    const body = { vehicle: "royal-enfield-himalayan", pickupAt: w.pickupAt, returnAt: w.returnAt, addons: [{ code: "helmet", quantity: 2 }] };
    const quoted = await json(await postJson("/api/v1/bookings/quote", body));
    expect(quoted.data.rentalDays).toBe(3);
    const before = (await db.select().from(bookings)).length;
    expect((await db.select().from(bookings)).length).toBe(before);
    const created = (await json(await book(cookie, body))).data;
    expect(created.pricing).toEqual(quoted.data.pricing);
    expect(created.addons[0]).toMatchObject({ code: "helmet", quantity: 2, days: 3, totalMinor: 200 * 2 * 3 });
  });

  test("a vehicle priced in KHR bills in KHR, with no conversion, and rejects USD add-ons", async () => {
    const { cookie: adminCookie } = await signInAdmin();
    const { cookie } = await signInCustomer();
    const location = (await json(await request("/api/v1/locations"))).data[0] as { id: string };
    const created = await postJson(
      "/api/v1/admin/vehicles",
      {
        slug: `khr-bike-${Math.random().toString(36).slice(2, 7)}`,
        vehicleType: "scooter",
        name: "KHR Scooter",
        brand: "Honda",
        model: "Scoopy",
        category: "commuter",
        dailyRentalPriceMinor: 3_280_000,
        securityDepositMinor: 41_000_000,
        currency: "KHR",
        registrationNumber: `KHR-${Math.random().toString(36).slice(2, 7)}`,
        locationId: location.id,
      },
      { cookie: adminCookie },
    );
    const slug = (await json(created)).data.slug as string;
    const w = window(2);

    const noAddons = await book(cookie, { vehicle: slug, pickupAt: w.pickupAt, returnAt: w.returnAt });
    expect(noAddons.status).toBe(201);
    const booking = (await json(noAddons)).data;
    expect(booking.currency).toBe("KHR");
    expect(booking.pricing.platformFeeMinor).toBe(0);
    expect(booking.pricing.dailyRateMinor).toBe(3_280_000);
    expect(booking.pricing.rentalSubtotalMinor).toBe(3_280_000 * 2);
    expect(booking.pricing.taxesMinor).toBe(656_000);
    expect(booking.pricing.totalPayableMinor).toBe(3_280_000 * 2 + 656_000 + 41_000_000);

    const w2 = window(2);
    const withUsdAddon = await book(cookie, { vehicle: slug, pickupAt: w2.pickupAt, returnAt: w2.returnAt, addons: [{ code: "helmet" }] });
    expect(withUsdAddon.status).toBe(422);
  });
});

describe("double booking", () => {
  test("an overlapping booking is refused with BOOKING_CONFLICT", async () => {
    const first = await signInCustomer();
    const second = await signInCustomer();
    const w = window(3);
    expect((await book(first.cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt })).status).toBe(201);

    const clash = await book(second.cookie, { vehicle: "honda-activa", pickupAt: `${w.y}-03-11T10:00:00.000Z`, returnAt: `${w.y}-03-14T10:00:00.000Z` });
    expect(clash.status).toBe(409);
    expect(await json(clash)).toMatchObject({ success: false, error: { code: "BOOKING_CONFLICT" } });
  });

  test("starting exactly when another rental ends is fine", async () => {
    const first = await signInCustomer();
    const second = await signInCustomer();
    const w = window(3);
    expect((await book(first.cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt })).status).toBe(201);
    expect((await book(second.cookie, { vehicle: "honda-activa", pickupAt: w.returnAt, returnAt: `${w.y}-03-16T10:00:00.000Z` })).status).toBe(201);
  });

  test("a cancelled booking no longer blocks the vehicle", async () => {
    const first = await signInCustomer();
    const second = await signInCustomer();
    const w = window(3);
    const created = (await json(await book(first.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt }))).data;
    expect((await book(second.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt })).status).toBe(409);

    expect((await postJson(`/api/v1/bookings/${created.reference}/cancel`, {}, { cookie: first.cookie })).status).toBe(200);
    expect((await book(second.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt })).status).toBe(201);
  });

  test("a maintenance block and a vehicle in maintenance both refuse bookings", async () => {
    const { cookie: adminCookie } = await signInAdmin();
    const { cookie } = await signInCustomer();
    const bike = await vehicleBySlug("royal-enfield-hunter-350");
    const w = window(3);
    await postJson(`/api/v1/admin/vehicles/${bike.id}/blocks`, { startAt: w.pickupAt, endAt: w.returnAt, reason: "Service" }, { cookie: adminCookie });
    expect((await book(cookie, { vehicle: "royal-enfield-hunter-350", pickupAt: w.pickupAt, returnAt: w.returnAt })).status).toBe(409);

    const w2 = window(2);
    await db.update(vehicles).set({ status: "maintenance" }).where(eq(vehicles.id, bike.id));
    try {
      const response = await book(cookie, { vehicle: "royal-enfield-hunter-350", pickupAt: w2.pickupAt, returnAt: w2.returnAt });
      expect(response.status).toBe(409);
      expect(await json(response)).toMatchObject({ error: { code: "VEHICLE_UNAVAILABLE" } });
    } finally {
      await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, bike.id));
    }
  });
});

describe("ownership", () => {
  test("another customer cannot read or cancel a booking, and lists show only their own", async () => {
    const owner = await signInCustomer();
    const stranger = await signInCustomer();
    const w = window(2);
    const created = (await json(await book(owner.cookie, { vehicle: "yamaha-mt-15", pickupAt: w.pickupAt, returnAt: w.returnAt }))).data;

    expect((await request(`/api/v1/bookings/${created.reference}`, { cookie: owner.cookie })).status).toBe(200);
    expect((await request(`/api/v1/bookings/${created.reference}`, { cookie: stranger.cookie })).status).toBe(404);
    expect((await postJson(`/api/v1/bookings/${created.reference}/cancel`, {}, { cookie: stranger.cookie })).status).toBe(404);

    const strangerList = await json(await request("/api/v1/bookings", { cookie: stranger.cookie }));
    expect(strangerList.data).toEqual([]);
    const ownerList = await json(await request("/api/v1/bookings", { cookie: owner.cookie }));
    expect(ownerList.data.map((b: { reference: string }) => b.reference)).toEqual([created.reference]);

    expect((await json(await request(`/api/v1/bookings/${created.reference}`, { cookie: owner.cookie }))).data.bookingStatus).toBe("pending");
  });

  test("every booking route needs a session", async () => {
    expect((await request("/api/v1/bookings")).status).toBe(401);
    expect((await request("/api/v1/bookings/RG12345678")).status).toBe(401);
    expect((await postJson("/api/v1/bookings", {})).status).toBe(401);
    expect((await postJson("/api/v1/bookings/RG12345678/cancel", {})).status).toBe(401);
  });
});

describe("cancelling", () => {
  test("cancel records the time and reason, clears the hold, and cancelling twice is harmless", async () => {
    const { cookie } = await signInCustomer();
    const w = window(2);
    const created = (await json(await book(cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt }))).data;
    const first = await postJson(`/api/v1/bookings/${created.reference}/cancel`, { reason: "Plans changed" }, { cookie });
    expect(first.status).toBe(200);
    expect((await json(first)).data).toMatchObject({ bookingStatus: "cancelled", cancellationReason: "Plans changed", holdExpiresAt: null, paymentStatus: "unpaid" });
    const again = await postJson(`/api/v1/bookings/${created.reference}/cancel`, {}, { cookie });
    expect(again.status).toBe(200);
    expect((await json(again)).data.cancellationReason).toBe("Plans changed");
  });

  test("cancelling never touches the payment state, so no refund is implied", async () => {
    const { cookie, userId } = await signInCustomer();
    const bike = await vehicleBySlug("honda-activa");
    const w = window(2);
    const row = await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.pickupAt, returnAt: w.returnAt, status: "confirmed" });
    await db.update(bookings).set({ paymentStatus: "paid" }).where(eq(bookings.id, row.id));
    const response = await postJson(`/api/v1/bookings/${row.reference}/cancel`, {}, { cookie });
    expect((await json(response)).data).toMatchObject({ bookingStatus: "cancelled", paymentStatus: "paid" });
  });

  test("an active or completed booking cannot be cancelled", async () => {
    const { cookie, userId } = await signInCustomer();
    const bike = await vehicleBySlug("honda-activa");
    for (const status of ["active", "completed"] as const) {
      const w = window(2);
      const row = await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.pickupAt, returnAt: w.returnAt, status });
      const response = await postJson(`/api/v1/bookings/${row.reference}/cancel`, {}, { cookie });
      expect(response.status).toBe(409);
      expect(await json(response)).toMatchObject({ error: { code: "INVALID_BOOKING_STATUS" } });
    }
  });
});

describe("validation", () => {
  test("bad requests are 422 with the standard envelope", async () => {
    const { cookie } = await signInCustomer();
    const w = window(2);
    const ok = { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt };
    const cases: Record<string, Record<string, unknown>> = {
      "pickup in the past": { ...ok, pickupAt: "2020-01-01T10:00:00Z", returnAt: "2020-01-03T10:00:00Z" },
      "return before pickup": { ...ok, returnAt: w.pickupAt.replace("T10", "T09") },
      "longer than the maximum": { ...ok, returnAt: `${w.y + 1}-03-10T10:00:00.000Z` },
      "unknown add-on": { ...ok, addons: [{ code: "jetpack" }] },
      "not a date": { ...ok, pickupAt: "tomorrow" },
      "missing vehicle": { pickupAt: w.pickupAt, returnAt: w.returnAt },
      "wrong pickup location": { ...ok, pickupLocationId: "00000000-0000-4000-8000-000000000000" },
    };
    for (const [name, body] of Object.entries(cases)) {
      const response = await book(cookie, body);
      expect({ name, status: response.status }).toEqual({ name, status: 422 });
      expect((await json(response)).error.code).toBe("VALIDATION_ERROR");
    }
    expect((await book(cookie, { ...ok, vehicle: "no-such-bike" })).status).toBe(404);
    expect((await request("/api/v1/bookings/not-a-reference", { cookie })).status).toBe(422);
  });

  test("the add-ons list is public", async () => {
    const body = await json(await request("/api/v1/addons"));
    expect(body.data.map((a: { code: string }) => a.code).sort()).toEqual(["helmet", "riding-jacket"]);
  });
});
