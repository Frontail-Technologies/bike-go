import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { bookings } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { json } from "./helpers/http";
import { postJson, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles, vehicleBySlug } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

let nextYear = 2110;
const window = (days = 3) => {
  const y = nextYear++;
  return { pickupAt: `${y}-03-10T10:00:00.000Z`, returnAt: `${y}-03-${10 + days}T10:00:00.000Z`, y };
};

const book = (cookie: string, body: Record<string, unknown>, key?: string) => postJson("/api/v1/bookings", body, { cookie, headers: key ? { "idempotency-key": key } : {} });
const customers = (n: number) => Promise.all(Array.from({ length: n }, () => signInCustomer()));

const tally = (statuses: number[]) => statuses.reduce<Record<number, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});

describe("concurrent bookings", () => {
  test("8 simultaneous requests for one period: exactly one wins", async () => {
    const users = await customers(8);
    const w = window(3);
    const responses = await Promise.all(users.map(({ cookie }) => book(cookie, { vehicle: "royal-enfield-himalayan", pickupAt: w.pickupAt, returnAt: w.returnAt })));
    expect(tally(responses.map((r) => r.status))).toEqual({ 201: 1, 409: 7 });

    const bike = await vehicleBySlug("royal-enfield-himalayan");
    const stored = (await db.select().from(bookings).where(eq(bookings.vehicleId, bike.id))).filter((b) => b.pickupAt.toISOString() === w.pickupAt);
    expect(stored).toHaveLength(1);
  });

  test("20 simultaneous requests: still exactly one, and every loser is BOOKING_CONFLICT", async () => {
    const users = await customers(20);
    const w = window(2);
    const responses = await Promise.all(users.map(({ cookie }) => book(cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt })));
    expect(tally(responses.map((r) => r.status))).toEqual({ 201: 1, 409: 19 });
    const losers = await Promise.all(responses.filter((r) => r.status === 409).map((r) => json(r)));
    expect(losers.every((body) => body.error.code === "BOOKING_CONFLICT")).toBe(true);
  });

  test("overlapping but different periods: only compatible ones succeed", async () => {
    const users = await customers(6);
    const y = nextYear++;
    const periods = [
      ["03-01", "03-04"],
      ["03-03", "03-06"],
      ["03-04", "03-07"],
      ["03-06", "03-09"],
      ["03-02", "03-05"],
      ["03-09", "03-12"],
    ] as const;
    const responses = await Promise.all(
      users.map(({ cookie }, i) => book(cookie, { vehicle: "yamaha-mt-15", pickupAt: `${y}-${periods[i]![0]}T10:00:00.000Z`, returnAt: `${y}-${periods[i]![1]}T10:00:00.000Z` })),
    );
    const winners = responses.map((r, i) => (r.status === 201 ? periods[i]! : null)).filter((p): p is (typeof periods)[number] => p !== null);
    expect(winners.length).toBeGreaterThanOrEqual(1);
    for (const a of winners) {
      for (const b of winners) {
        if (a === b) continue;
        const overlap = a[0] < b[1] && b[0] < a[1];
        expect({ a, b, overlap }).toEqual({ a, b, overlap: false });
      }
    }
    expect(responses.every((r) => r.status === 201 || r.status === 409)).toBe(true);
  });

  test("a booking racing a maintenance block: exactly one of them wins", async () => {
    const staff = await signInAdmin();
    const [customer] = await customers(1);
    const bike = await vehicleBySlug("royal-enfield-hunter-350");
    const w = window(3);
    const [booking, block] = await Promise.all([
      book(customer!.cookie, { vehicle: "royal-enfield-hunter-350", pickupAt: w.pickupAt, returnAt: w.returnAt }),
      postJson(`/api/v1/admin/vehicles/${bike.id}/blocks`, { startAt: w.pickupAt, endAt: w.returnAt, reason: "Service" }, { cookie: staff.cookie }),
    ]);
    const outcomes = [booking.status === 201, block.status === 200];
    expect(outcomes.filter(Boolean)).toHaveLength(1);
    expect([booking.status, block.status].filter((s) => s === 409)).toHaveLength(1);
  });

  test("when a lapsed hold is in the way, a racing group still produces exactly one booking", async () => {
    const [holder, ...rivals] = await customers(6);
    const w = window(2);
    const first = (await json(await book(holder!.cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt }))).data;
    await db.update(bookings).set({ holdExpiresAt: new Date(Date.now() - 60_000) }).where(eq(bookings.reference, first.reference));

    const responses = await Promise.all(rivals.map(({ cookie }) => book(cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt })));
    expect(tally(responses.map((r) => r.status))).toEqual({ 201: 1, 409: 4 });
    const [old] = await db.select({ status: bookings.bookingStatus }).from(bookings).where(eq(bookings.reference, first.reference));
    expect(old?.status).toBe("expired");
  });
});

describe("idempotency", () => {
  test("retrying with the same key returns the same booking and creates only one", async () => {
    const { cookie, userId } = await signInCustomer();
    const w = window(2);
    const body = { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt };
    const first = await book(cookie, body, "retry-key-0001");
    const second = await book(cookie, body, "retry-key-0001");
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers.get("idempotent-replayed")).toBe("true");
    expect(first.headers.get("idempotent-replayed")).toBeNull();
    expect((await json(second)).data.reference).toBe((await json(first)).data.reference);
    expect((await db.select().from(bookings).where(eq(bookings.userId, userId))).length).toBe(1);
  });

  test("the same key with a different request is IDEMPOTENCY_CONFLICT", async () => {
    const { cookie } = await signInCustomer();
    const w = window(2);
    const w2 = window(2);
    expect((await book(cookie, { vehicle: "honda-activa", pickupAt: w.pickupAt, returnAt: w.returnAt }, "reused-key-0002")).status).toBe(201);
    const different = await book(cookie, { vehicle: "honda-activa", pickupAt: w2.pickupAt, returnAt: w2.returnAt }, "reused-key-0002");
    expect(different.status).toBe(409);
    expect(await json(different)).toMatchObject({ error: { code: "IDEMPOTENCY_CONFLICT" } });
  });

  test("10 concurrent retries with one key create exactly one booking", async () => {
    const { cookie, userId } = await signInCustomer();
    const w = window(2);
    const body = { vehicle: "yamaha-mt-15", pickupAt: w.pickupAt, returnAt: w.returnAt };
    const responses = await Promise.all(Array.from({ length: 10 }, () => book(cookie, body, "parallel-key-0003")));
    expect(responses.every((r) => r.status === 201)).toBe(true);
    const references = new Set(await Promise.all(responses.map(async (r) => (await json(r)).data.reference)));
    expect(references.size).toBe(1);
    expect((await db.select().from(bookings).where(eq(bookings.userId, userId))).length).toBe(1);
  });

  test("keys are per user: another customer reusing a key gets their own booking", async () => {
    const a = await signInCustomer();
    const b = await signInCustomer();
    const wa = window(2);
    const wb = window(2);
    const first = await book(a.cookie, { vehicle: "honda-activa", pickupAt: wa.pickupAt, returnAt: wa.returnAt }, "shared-key-0004");
    const second = await book(b.cookie, { vehicle: "honda-activa", pickupAt: wb.pickupAt, returnAt: wb.returnAt }, "shared-key-0004");
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await json(first)).data.reference).not.toBe((await json(second)).data.reference);
  });

  test("a failed attempt is not cached", async () => {
    const a = await signInCustomer();
    const b = await signInCustomer();
    const w = window(2);
    await book(a.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt });
    const conflict = await book(b.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt }, "failed-key-0005");
    expect(conflict.status).toBe(409);
    expect((await book(b.cookie, { vehicle: "ktm-duke-200", pickupAt: w.pickupAt, returnAt: w.returnAt }, "failed-key-0005")).status).toBe(409);
  });
});
