import { beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/libs/db";
import { PG } from "../src/libs/db/errors";
import { bookings, vehicles } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { json } from "./helpers/http";
import { postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { insertBooking, sqlstateOf, vehicleBySlug } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});

let nextYear = 2040;
const freshWindow = () => {
  const year = nextYear++;
  return { y: year, at: (md: string, hm = "10:00") => `${year}-${md}T${hm}:00.000Z` };
};

const availability = async (slug: string, from: string, to: string) => json(await request(`/api/v1/vehicles/${slug}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));

describe("availability", () => {
  test("a free period is bookable", async () => {
    const w = freshWindow();
    const body = await availability("honda-activa", w.at("03-01"), w.at("03-04"));
    expect(body.data).toMatchObject({ bookable: true, reason: null, unavailablePeriods: [] });
  });

  test("overlapping holds block the period: partial, containing and contained overlaps", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("honda-activa");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("05-10"), returnAt: w.at("05-15") });

    for (const [from, to] of [
      [w.at("05-08"), w.at("05-11")],
      [w.at("05-14"), w.at("05-20")],
      [w.at("05-01"), w.at("05-30")],
      [w.at("05-11"), w.at("05-12")],
    ]) {
      const body = await availability("honda-activa", from!, to!);
      expect(body.data.bookable).toBe(false);
      expect(body.data.reason).toBe("period_taken");
      expect(body.data.unavailablePeriods.length).toBe(1);
      expect(body.data.unavailablePeriods[0].kind).toBe("booking");
    }
  });

  test("back-to-back periods do not conflict", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("honda-activa");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("06-10"), returnAt: w.at("06-15") });
    expect((await availability("honda-activa", w.at("06-15"), w.at("06-18"))).data.bookable).toBe(true);
    expect((await availability("honda-activa", w.at("06-05"), w.at("06-10"))).data.bookable).toBe(true);
  });

  test("holding statuses block; completed, cancelled, expired and lapsed pending holds do not", async () => {
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("yamaha-mt-15");
    const w = freshWindow();
    const lapsed = new Date(Date.now() - 60_000);
    const cases: [string, boolean, Date | null | undefined][] = [
      ["confirmed", false, undefined],
      ["ready_for_pickup", false, undefined],
      ["active", false, undefined],
      ["pending", false, undefined],
      ["pending", true, lapsed],
      ["completed", true, undefined],
      ["cancelled", true, undefined],
      ["expired", true, lapsed],
    ];
    let day = 1;
    for (const [status, bookable, hold] of cases) {
      const start = String(day).padStart(2, "0");
      const end = String(day + 2).padStart(2, "0");
      await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at(`07-${start}`), returnAt: w.at(`07-${end}`), status: status as never, holdExpiresAt: hold });
      const body = await availability("yamaha-mt-15", w.at(`07-${start}`, "12:00"), w.at(`07-${end}`, "08:00"));
      expect({ status, lapsed: hold === lapsed, bookable: body.data.bookable }).toEqual({ status, lapsed: hold === lapsed, bookable });
      day += 3;
    }
  });

  test("cancelling a booking frees the period again", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("ktm-duke-200");
    const booking = await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("08-10"), returnAt: w.at("08-12") });
    expect((await availability("ktm-duke-200", w.at("08-10"), w.at("08-12"))).data.bookable).toBe(false);
    await db.update(bookings).set({ bookingStatus: "cancelled", cancelledAt: new Date() }).where(eq(bookings.id, booking.id));
    expect((await availability("ktm-duke-200", w.at("08-10"), w.at("08-12"))).data.bookable).toBe(true);
  });

  test("a maintenance block makes the period unavailable", async () => {
    const w = freshWindow();
    const { cookie } = await signInAdmin();
    const bike = await vehicleBySlug("royal-enfield-hunter-350");
    const block = await postJson(`/api/v1/admin/vehicles/${bike.id}/blocks`, { startAt: w.at("09-10"), endAt: w.at("09-14"), reason: "Chain and brake service" }, { cookie });
    expect(block.status).toBe(200);

    const body = await availability("royal-enfield-hunter-350", w.at("09-12"), w.at("09-13"));
    expect(body.data).toMatchObject({ bookable: false, reason: "period_taken" });
    expect(body.data.unavailablePeriods[0].kind).toBe("block");
    expect((await availability("royal-enfield-hunter-350", w.at("09-14"), w.at("09-16"))).data.bookable).toBe(true);
  });

  test("a block cannot be placed over an existing booking", async () => {
    const w = freshWindow();
    const { cookie } = await signInAdmin();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("royal-enfield-himalayan");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("10-10"), returnAt: w.at("10-14") });
    const response = await postJson(`/api/v1/admin/vehicles/${bike.id}/blocks`, { startAt: w.at("10-12"), endAt: w.at("10-20"), reason: "Service" }, { cookie });
    expect(response.status).toBe(409);
    expect(await json(response)).toMatchObject({ error: { code: "BOOKING_CONFLICT" } });
  });

  test("a vehicle in maintenance or inactive status cannot be booked at all", async () => {
    const w = freshWindow();
    const bike = await vehicleBySlug("royal-enfield-classic-350");
    await db.update(vehicles).set({ status: "maintenance" }).where(eq(vehicles.id, bike.id));
    try {
      const body = await availability("royal-enfield-classic-350", w.at("11-01"), w.at("11-03"));
      expect(body.data).toMatchObject({ bookable: false, reason: "vehicle_unavailable" });
    } finally {
      await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, bike.id));
    }
  });

  test("availability is found by id as well as slug, and bad input is rejected", async () => {
    const w = freshWindow();
    const bike = await vehicleBySlug("honda-activa");
    const byId = await json(await request(`/api/v1/vehicles/${bike.id}/availability?from=${encodeURIComponent(w.at("12-01"))}&to=${encodeURIComponent(w.at("12-02"))}`));
    expect(byId.data.vehicleId).toBe(bike.id);

    expect((await request(`/api/v1/vehicles/honda-activa/availability?from=${encodeURIComponent(w.at("12-05"))}&to=${encodeURIComponent(w.at("12-01"))}`)).status).toBe(422);
    expect((await request("/api/v1/vehicles/honda-activa/availability")).status).toBe(422);
    expect((await request("/api/v1/vehicles/honda-activa/availability?from=nope&to=nope")).status).toBe(422);
    expect((await request(`/api/v1/vehicles/no-such-bike/availability?from=${encodeURIComponent(w.at("12-01"))}&to=${encodeURIComponent(w.at("12-02"))}`)).status).toBe(404);
  });

  test("an unexpired pending hold also hides the vehicle from the list", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("ktm-duke-200");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("04-10"), returnAt: w.at("04-14") });
    const free = await json(await request(`/api/v1/vehicles?pickupAt=${encodeURIComponent(w.at("04-11"))}&returnAt=${encodeURIComponent(w.at("04-12"))}`));
    const slugs = free.data.map((v: { slug: string }) => v.slug);
    expect(slugs).not.toContain("ktm-duke-200");
    expect(slugs).toContain("yamaha-mt-15");
  });
});

describe("the database is the last line of defence", () => {
  test("two overlapping holding bookings for one vehicle cannot both be stored", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("royal-enfield-hunter-350");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("02-10"), returnAt: w.at("02-14") });
    const code = await sqlstateOf(() => insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("02-12"), returnAt: w.at("02-16") }));
    expect(code).toBe(PG.exclusionViolation);
  });

  test("a cancelled overlap is allowed, but un-cancelling it into a conflict is refused", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const bike = await vehicleBySlug("royal-enfield-himalayan");
    await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("02-10"), returnAt: w.at("02-14") });
    const cancelled = await insertBooking({ vehicleId: bike.id, userId, pickupAt: w.at("02-11"), returnAt: w.at("02-13"), status: "cancelled" });
    const code = await sqlstateOf(() => db.update(bookings).set({ bookingStatus: "confirmed" }).where(eq(bookings.id, cancelled.id)));
    expect(code).toBe(PG.exclusionViolation);
  });

  test("different vehicles can be booked for the same period", async () => {
    const w = freshWindow();
    const { userId } = await signInCustomer();
    const a = await vehicleBySlug("honda-activa");
    const b = await vehicleBySlug("ktm-duke-200");
    await insertBooking({ vehicleId: a.id, userId, pickupAt: w.at("02-10"), returnAt: w.at("02-14") });
    expect(await sqlstateOf(() => insertBooking({ vehicleId: b.id, userId, pickupAt: w.at("02-10"), returnAt: w.at("02-14") }))).toBeUndefined();
  });
});
