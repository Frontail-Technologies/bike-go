import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { bookings } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { cachedFor } from "../src/libs/ttl-cache";
import { json } from "./helpers/http";
import { postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { bookVehicle, rentalWindow } from "./helpers/booking";
import { cleanupExtraVehicles } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

const lapse = (reference: string) => db.update(bookings).set({ holdExpiresAt: new Date(Date.now() - 60_000) }).where(eq(bookings.reference, reference));
const rowOf = async (reference: string) => (await db.select().from(bookings).where(eq(bookings.reference, reference)))[0]!;

async function lapsedBooking() {
  const session = await signInCustomer();
  const created = (await json(await bookVehicle(session.cookie, "honda-activa", rentalWindow()))).data as { reference: string };
  await lapse(created.reference);
  return { ...session, reference: created.reference };
}

describe("reads do not write", () => {
  test("a lapsed hold reads as expired everywhere without changing the stored row", async () => {
    const { cookie, reference } = await lapsedBooking();
    const admin = await signInAdmin();

    const mine = (await json(await request(`/api/v1/bookings/${reference}`, { cookie }))).data;
    expect(mine.bookingStatus).toBe("expired");
    const listed = (await json(await request("/api/v1/bookings", { cookie }))).data.find((b: { reference: string }) => b.reference === reference);
    expect(listed.bookingStatus).toBe("expired");
    const staff = (await json(await request(`/api/v1/admin/bookings/${reference}`, { cookie: admin.cookie }))).data;
    expect(staff.bookingStatus).toBe("expired");
    expect(staff.allowedNextStatuses).toEqual([]);
    const pay = (await json(await request(`/api/v1/bookings/${reference}/payment`, { cookie }))).data;
    expect(pay.bookingStatus).toBe("expired");

    expect((await rowOf(reference)).bookingStatus).toBe("pending");
  });

  test("status filters use the effective status", async () => {
    const { cookie, reference } = await lapsedBooking();
    const admin = await signInAdmin();
    const refs = async (path: string, who: string) => ((await json(await request(path, { cookie: who }))).data as { reference: string }[]).map((b) => b.reference);

    expect(await refs("/api/v1/bookings?status=expired", cookie)).toContain(reference);
    expect(await refs("/api/v1/bookings?status=pending", cookie)).not.toContain(reference);
    expect(await refs("/api/v1/admin/bookings?status=expired&pageSize=100", admin.cookie)).toContain(reference);
    expect(await refs("/api/v1/admin/bookings?status=pending&pageSize=100", admin.cookie)).not.toContain(reference);
    expect((await rowOf(reference)).bookingStatus).toBe("pending");
  });

  test("the dashboard counts a lapsed hold as expired", async () => {
    const { reference } = await lapsedBooking();
    const admin = await signInAdmin();
    const byStatus = (await json(await request("/api/v1/admin/dashboard", { cookie: admin.cookie }))).data.bookings.byStatus as Record<string, number>;
    expect(byStatus.expired).toBeGreaterThanOrEqual(1);
    const stored = await db.select().from(bookings).where(eq(bookings.bookingStatus, "pending"));
    const lapsedStored = stored.filter((b) => b.holdExpiresAt && b.holdExpiresAt <= new Date()).length;
    expect(byStatus.pending ?? 0).toBe(stored.length - lapsedStored);
    expect((await rowOf(reference)).bookingStatus).toBe("pending");
  });

  test("reading a booking issues no UPDATE", async () => {
    const { cookie, reference } = await lapsedBooking();
    const spy = spyOn(db, "update");
    try {
      await request(`/api/v1/bookings/${reference}`, { cookie });
      await request("/api/v1/bookings", { cookie });
      await request(`/api/v1/bookings/${reference}/payment`, { cookie });
    } finally {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });

  test("a lapsed booking cannot be paid or cancelled, and a competing booking expires it for real", async () => {
    const owner = await signInCustomer();
    const rival = await signInCustomer();
    const window = rentalWindow();
    const created = (await json(await bookVehicle(owner.cookie, "honda-activa", window))).data as { reference: string };
    await lapse(created.reference);

    const pay = await postJson(`/api/v1/bookings/${created.reference}/payments`, {}, { cookie: owner.cookie });
    expect(pay.status).toBe(409);
    expect((await postJson(`/api/v1/bookings/${created.reference}/cancel`, {}, { cookie: owner.cookie })).status).toBe(409);

    expect((await bookVehicle(rival.cookie, "honda-activa", window)).status).toBe(201);
    expect((await rowOf(created.reference)).bookingStatus).toBe("expired");
  });
});

describe("signed-in requests do less work", () => {
  test("GET /me reads the database at most twice with a cached session cookie", async () => {
    const { cookie } = await signInCustomer();
    await request("/api/v1/me", { cookie });
    const spy = spyOn(db, "select");
    let reads: number;
    try {
      const response = await request("/api/v1/me", { cookie });
      expect(response.status).toBe(200);
    } finally {
      reads = spy.mock.calls.length;
      spy.mockRestore();
    }
    expect(reads).toBeLessThanOrEqual(2);
  });

  test("admin routes always check the database for the session", async () => {
    const { cookie } = await signInAdmin();
    await request("/api/v1/admin/me", { cookie });
    const spy = spyOn(db, "select");
    let reads: number;
    try {
      expect((await request("/api/v1/admin/me", { cookie })).status).toBe(200);
    } finally {
      reads = spy.mock.calls.length;
      spy.mockRestore();
    }
    expect(reads).toBeGreaterThanOrEqual(1);
  });
});

describe("short-lived cache helper", () => {
  test("it reuses a result inside the window and loads again after it", async () => {
    let loads = 0;
    const read = cachedFor(1, async () => ++loads);
    expect(await read()).toBe(1);
    expect(await read()).toBe(1);
    read.clear();
    expect(await read()).toBe(2);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(await read()).toBe(3);
  });

  test("simultaneous callers share one load, and a failed load is not cached", async () => {
    let loads = 0;
    const read = cachedFor(30, async () => {
      loads += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return loads;
    });
    expect(await Promise.all([read(), read(), read()])).toEqual([1, 1, 1]);

    let attempts = 0;
    const flaky = cachedFor(30, async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("first load fails");
      return attempts;
    });
    await expect(flaky()).rejects.toThrow("first load fails");
    expect(await flaky()).toBe(2);
  });

  test("a window of zero disables caching", async () => {
    let loads = 0;
    const read = cachedFor(0, async () => ++loads);
    expect([await read(), await read()]).toEqual([1, 2]);
  });
});
