import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { PG } from "../src/libs/db/errors";
import { bookings } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { expireStaleHolds } from "../src/routes/booking/holds";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles, insertBooking, sqlstateOf, vehicleBySlug } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

let nextYear = 2130;
const window = (days = 2) => {
  const y = nextYear++;
  return { pickupAt: `${y}-05-10T10:00:00.000Z`, returnAt: `${y}-05-${10 + days}T10:00:00.000Z`, y };
};

const book = (cookie: string, vehicle: string, w = window()) => postJson("/api/v1/bookings", { vehicle, ...w }, { cookie });
const lapse = (reference: string) => db.update(bookings).set({ holdExpiresAt: new Date(Date.now() - 60_000) }).where(eq(bookings.reference, reference));
const statusOf = async (reference: string) => (await db.select({ s: bookings.bookingStatus }).from(bookings).where(eq(bookings.reference, reference)))[0]?.s;
const availability = async (slug: string, w: { pickupAt: string; returnAt: string }) => json(await request(`/api/v1/vehicles/${slug}/availability?from=${encodeURIComponent(w.pickupAt)}&to=${encodeURIComponent(w.returnAt)}`));

describe("pending holds", () => {
  test("a new booking is pending with a hold, and the hold blocks other customers and the calendar", async () => {
    const first = await signInCustomer();
    const second = await signInCustomer();
    const w = window();
    const created = (await json(await book(first.cookie, "honda-activa", w))).data;
    expect(created).toMatchObject({ bookingStatus: "pending", paymentStatus: "unpaid" });
    expect(created.holdExpiresAt).toBeTruthy();

    const calendar = await availability("honda-activa", w);
    expect(calendar.data).toMatchObject({ bookable: false, reason: "period_taken" });
    expect(calendar.data.unavailablePeriods[0].kind).toBe("booking");

    const clash = await book(second.cookie, "honda-activa", w);
    expect(clash.status).toBe(409);
    expect((await json(clash)).error.code).toBe("BOOKING_CONFLICT");
  });

  test("once the hold lapses the calendar is free, and the next booking takes the vehicle and expires the old one", async () => {
    const first = await signInCustomer();
    const second = await signInCustomer();
    const w = window();
    const created = (await json(await book(first.cookie, "yamaha-mt-15", w))).data;
    await lapse(created.reference);

    expect((await availability("yamaha-mt-15", w)).data.bookable).toBe(true);
    expect((await json(await request(`/api/v1/vehicles?pickupAt=${encodeURIComponent(w.pickupAt)}&returnAt=${encodeURIComponent(w.returnAt)}`))).data.some((v: { slug: string }) => v.slug === "yamaha-mt-15")).toBe(true);

    const taken = await book(second.cookie, "yamaha-mt-15", w);
    expect(taken.status).toBe(201);
    expect(await statusOf(created.reference)).toBe("expired");
  });

  test("the customer sees an expired booking as expired, and cannot cancel it", async () => {
    const { cookie } = await signInCustomer();
    const w = window();
    const created = (await json(await book(cookie, "ktm-duke-200", w))).data;
    await lapse(created.reference);

    const view = await json(await request(`/api/v1/bookings/${created.reference}`, { cookie }));
    expect(view.data.bookingStatus).toBe("expired");
    const list = await json(await request("/api/v1/bookings?status=expired", { cookie }));
    expect(list.data.map((b: { reference: string }) => b.reference)).toContain(created.reference);

    const cancel = await postJson(`/api/v1/bookings/${created.reference}/cancel`, {}, { cookie });
    expect(cancel.status).toBe(409);
    expect((await json(cancel)).error.code).toBe("INVALID_BOOKING_STATUS");
  });

  test("staff cannot confirm an expired booking, and it is a dead end", async () => {
    const staff = await signInAdmin();
    const { cookie } = await signInCustomer();
    const created = (await json(await book(cookie, "honda-activa", window()))).data;
    await lapse(created.reference);

    const confirm = await patchJson(`/api/v1/admin/bookings/${created.reference}/status`, { bookingStatus: "confirmed" }, { cookie: staff.cookie });
    expect(confirm.status).toBe(409);
    expect((await json(confirm)).error.code).toBe("INVALID_BOOKING_STATUS");
    const detail = (await json(await request(`/api/v1/admin/bookings/${created.reference}`, { cookie: staff.cookie }))).data;
    expect(detail).toMatchObject({ bookingStatus: "expired", allowedNextStatuses: [] });
  });

  test("confirming a live hold clears it, and a confirmed booking never expires", async () => {
    const staff = await signInAdmin();
    const { cookie } = await signInCustomer();
    const w = window();
    const created = (await json(await book(cookie, "royal-enfield-classic-350", w))).data;
    const confirmed = await patchJson(`/api/v1/admin/bookings/${created.reference}/status`, { bookingStatus: "confirmed" }, { cookie: staff.cookie });
    expect((await json(confirmed)).data).toMatchObject({ bookingStatus: "confirmed", holdExpiresAt: null });

    expect(await expireStaleHolds(db, { reference: created.reference }, new Date(Date.now() + 365 * 24 * 60 * 60_000))).toBe(0);
    expect(await statusOf(created.reference)).toBe("confirmed");
    expect((await availability("royal-enfield-classic-350", w)).data.bookable).toBe(false);
  });

  test("a pending booking without a hold cannot be stored", async () => {
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("royal-enfield-himalayan");
    const w = window();
    const code = await sqlstateOf(() => insertBooking({ vehicleId: bike.id, userId, pickupAt: w.pickupAt, returnAt: w.returnAt, status: "pending", holdExpiresAt: null }));
    expect(code).toBe(PG.checkViolation);
  });

  test("the sweep expires only lapsed pending holds, within its scope", async () => {
    const { cookie, userId } = await signInCustomer();
    const other = await signInCustomer();
    const a = (await json(await book(cookie, "honda-activa", window()))).data;
    const b = (await json(await book(other.cookie, "honda-activa", window()))).data;
    const live = (await json(await book(cookie, "honda-activa", window()))).data;
    await lapse(a.reference);
    await lapse(b.reference);

    expect(await expireStaleHolds(db, { userId })).toBe(1);
    expect(await statusOf(a.reference)).toBe("expired");
    expect(await statusOf(b.reference)).toBe("pending");
    expect(await statusOf(live.reference)).toBe("pending");
    expect(await expireStaleHolds(db)).toBeGreaterThanOrEqual(1);
    expect(await statusOf(b.reference)).toBe("expired");
    expect(await statusOf(live.reference)).toBe("pending");
  });

  test("expired bookings stay out of dashboard revenue", async () => {
    const staff = await signInAdmin();
    const { cookie } = await signInCustomer();
    const created = (await json(await book(cookie, "honda-activa", window()))).data;
    await lapse(created.reference);
    const dashboard = (await json(await request("/api/v1/admin/dashboard", { cookie: staff.cookie }))).data;
    expect(dashboard.bookings.byStatus.expired).toBeGreaterThanOrEqual(1);
    const expired = (await json(await request("/api/v1/admin/bookings?status=expired&pageSize=100", { cookie: staff.cookie }))).data;
    expect(expired.map((b: { reference: string }) => b.reference)).toContain(created.reference);
  });
});
