import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { seedCatalog } from "../src/libs/db/seed";
import { STAFF_BOOKING_TRANSITIONS } from "../src/routes/booking/rules";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles, insertBooking, vehicleBySlug } from "./helpers/db";
import { submittedLoan } from "./helpers/loan";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

let nextYear = 2080;
const window = (days = 2) => {
  const y = nextYear++;
  return { pickupAt: `${y}-04-10T10:00:00.000Z`, returnAt: `${y}-04-${10 + days}T10:00:00.000Z` };
};

const book = async (cookie: string, vehicle: string, w = window()) => {
  const response = await postJson("/api/v1/bookings", { vehicle, ...w }, { cookie });
  expect(response.status).toBe(201);
  return (await json(response)).data as { reference: string };
};
const setBooking = (cookie: string, reference: string, body: Record<string, unknown>) => patchJson(`/api/v1/admin/bookings/${reference}/status`, body, { cookie });

describe("admin access", () => {
  test("every admin area refuses customers (403) and anonymous callers (401)", async () => {
    const { cookie } = await signInCustomer();
    for (const path of ["/api/v1/admin/dashboard", "/api/v1/admin/bookings", "/api/v1/admin/customers", "/api/v1/admin/loans", "/api/v1/admin/vehicles", "/api/v1/admin/locations"]) {
      expect({ path, status: (await request(path)).status }).toEqual({ path, status: 401 });
      expect({ path, status: (await request(path, { cookie })).status }).toEqual({ path, status: 403 });
    }
    expect((await setBooking(cookie, "RG12345678", { bookingStatus: "cancelled" })).status).toBe(403);
  });
});

describe("dashboard", () => {
  test("reports counts, per-currency revenue, awaiting-review loans and recent activity", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    await book(customer.cookie, "honda-activa");
    await submittedLoan(customer.cookie);

    const response = await request("/api/v1/admin/dashboard", { cookie: staff.cookie });
    expect(response.status).toBe(200);
    const d = (await json(response)).data;
    expect(d.vehicles.total).toBeGreaterThanOrEqual(6);
    expect(d.bookings.byStatus.confirmed).toBeGreaterThanOrEqual(1);
    expect(d.bookings.total).toBe(Object.values(d.bookings.byStatus as Record<string, number>).reduce((a, b) => a + b, 0));
    const usd = d.bookings.revenue.find((r: { currency: string }) => r.currency === "USD");
    expect(usd.bookedMinor).toBeGreaterThan(0);
    expect(Number.isInteger(usd.bookedMinor)).toBe(true);
    expect(usd.paidMinor).toBeLessThanOrEqual(usd.bookedMinor);
    expect(d.loans.awaitingReview).toBeGreaterThanOrEqual(1);
    expect(d.customers.total).toBeGreaterThanOrEqual(1);
    expect(d.recentBookings.length).toBeGreaterThan(0);
    expect(d.recentLoans.length).toBeGreaterThan(0);
  });
});

describe("bookings", () => {
  test("the list searches, filters, sorts and paginates; detail carries the customer", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer({ first_name: "Searchable", last_name: "Rider" });
    const a = await book(customer.cookie, "yamaha-mt-15");
    await book(customer.cookie, "ktm-duke-200");

    const byRef = await json(await request(`/api/v1/admin/bookings?q=${a.reference}`, { cookie: staff.cookie }));
    expect(byRef.data.map((b: { reference: string }) => b.reference)).toEqual([a.reference]);
    const byName = await json(await request("/api/v1/admin/bookings?q=Searchable", { cookie: staff.cookie }));
    expect(byName.data.length).toBe(2);
    expect(byName.data[0].customer).toMatchObject({ id: customer.userId, name: "Searchable Rider" });
    const byVehicle = await json(await request("/api/v1/admin/bookings?q=Duke", { cookie: staff.cookie }));
    expect(byVehicle.data.every((b: { vehicle: { slug: string } }) => b.vehicle.slug === "ktm-duke-200")).toBe(true);

    const paged = await json(await request("/api/v1/admin/bookings?pageSize=1&page=2&sort=total_desc", { cookie: staff.cookie }));
    expect(paged.data).toHaveLength(1);
    expect(paged.meta).toMatchObject({ page: 2, pageSize: 1 });
    const confirmed = await json(await request("/api/v1/admin/bookings?status=confirmed&pageSize=100", { cookie: staff.cookie }));
    expect(confirmed.data.every((b: { bookingStatus: string }) => b.bookingStatus === "confirmed")).toBe(true);

    const detail = await json(await request(`/api/v1/admin/bookings/${a.reference}`, { cookie: staff.cookie }));
    expect(detail.data).toMatchObject({ reference: a.reference, allowedNextStatuses: ["ready_for_pickup", "cancelled"], customer: { name: "Searchable Rider" } });
    expect((await request("/api/v1/admin/bookings/RG00000000", { cookie: staff.cookie })).status).toBe(404);
  });

  test("a booking moves forward along the allowed path to completed", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const { reference } = await book(customer.cookie, "honda-activa");

    for (const status of ["ready_for_pickup", "active", "completed"]) {
      const response = await setBooking(staff.cookie, reference, { bookingStatus: status });
      expect(response.status).toBe(200);
      expect((await json(response)).data.bookingStatus).toBe(status);
    }
    expect((await json(await request(`/api/v1/bookings/${reference}`, { cookie: customer.cookie }))).data.bookingStatus).toBe("completed");
  });

  test("invalid moves are refused: skipping, going back, reopening, cancelling a rental in progress", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const { reference } = await book(customer.cookie, "honda-activa");

    for (const bookingStatus of ["active", "completed", "pending"]) {
      const response = await setBooking(staff.cookie, reference, { bookingStatus });
      expect({ bookingStatus, status: response.status }).toEqual({ bookingStatus, status: 409 });
      expect((await json(response)).error.code).toBe("INVALID_BOOKING_STATUS");
    }
    await setBooking(staff.cookie, reference, { bookingStatus: "ready_for_pickup" });
    await setBooking(staff.cookie, reference, { bookingStatus: "active" });
    expect((await setBooking(staff.cookie, reference, { bookingStatus: "cancelled" })).status).toBe(409);
    await setBooking(staff.cookie, reference, { bookingStatus: "completed" });
    expect((await setBooking(staff.cookie, reference, { bookingStatus: "active" })).status).toBe(409);
    expect(STAFF_BOOKING_TRANSITIONS.completed).toEqual([]);
  });

  test("staff cancel with a reason, which frees the vehicle", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const other = await signInCustomer();
    const w = window();
    const { reference } = await book(customer.cookie, "ktm-duke-200", w);
    expect((await postJson("/api/v1/bookings", { vehicle: "ktm-duke-200", ...w }, { cookie: other.cookie })).status).toBe(409);

    const cancelled = await setBooking(staff.cookie, reference, { bookingStatus: "cancelled", note: "Bike damaged in storage" });
    expect((await json(cancelled)).data).toMatchObject({ bookingStatus: "cancelled", cancellationReason: "Bike damaged in storage", allowedNextStatuses: [] });
    expect((await postJson("/api/v1/bookings", { vehicle: "ktm-duke-200", ...w }, { cookie: other.cookie })).status).toBe(201);
  });

  test("payment state is recorded by hand, on its own or with a status change", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const { reference } = await book(customer.cookie, "yamaha-mt-15");
    const paid = await setBooking(staff.cookie, reference, { paymentStatus: "paid" });
    expect((await json(paid)).data).toMatchObject({ paymentStatus: "paid", bookingStatus: "confirmed" });
    const both = await setBooking(staff.cookie, reference, { bookingStatus: "ready_for_pickup", paymentStatus: "paid" });
    expect((await json(both)).data).toMatchObject({ paymentStatus: "paid", bookingStatus: "ready_for_pickup" });
    expect((await request("/api/v1/admin/dashboard", { cookie: staff.cookie }).then(json)).data.bookings.revenue[0].paidMinor).toBeGreaterThan(0);
  });

  test("an empty or unknown body is a 422", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const { reference } = await book(customer.cookie, "honda-activa");
    expect((await setBooking(staff.cookie, reference, {})).status).toBe(422);
    expect((await setBooking(staff.cookie, reference, { bookingStatus: "teleported" })).status).toBe(422);
    expect((await setBooking(staff.cookie, reference, { totalPayableMinor: 1 })).status).toBe(422);
  });

  test("confirming a pending booking onto a taken period is refused, not stored", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const w = window();
    const bike = await vehicleBySlug("royal-enfield-classic-350");
    await insertBooking({ vehicleId: bike.id, userId: customer.userId, pickupAt: w.pickupAt, returnAt: w.returnAt, status: "confirmed" });
    const pending = await insertBooking({ vehicleId: bike.id, userId: customer.userId, pickupAt: w.pickupAt, returnAt: w.returnAt, status: "pending" });

    const response = await setBooking(staff.cookie, pending.reference, { bookingStatus: "confirmed" });
    expect(response.status).toBe(409);
    expect((await json(response)).error.code).toBe("BOOKING_CONFLICT");
    expect((await json(await request(`/api/v1/admin/bookings/${pending.reference}`, { cookie: staff.cookie }))).data.bookingStatus).toBe("pending");
  });
});

describe("customers", () => {
  test("lists customers only, with search, counts and providers", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer({ first_name: "Unique", last_name: "Customerson" });
    await book(customer.cookie, "honda-activa");
    await submittedLoan(customer.cookie);

    const found = await json(await request("/api/v1/admin/customers?q=Customerson", { cookie: staff.cookie }));
    expect(found.data).toHaveLength(1);
    expect(found.data[0]).toMatchObject({ id: customer.userId, name: "Unique Customerson", role: "customer", providers: ["telegram"], bookingCount: 1, loanCount: 1, email: null });

    const all = await json(await request("/api/v1/admin/customers?pageSize=100", { cookie: staff.cookie }));
    expect(all.data.every((c: { role: string }) => c.role === "customer")).toBe(true);
    expect(all.data.some((c: { id: string }) => c.id === staff.userId)).toBe(false);
  });

  test("detail shows the profile with recent bookings and loans; unknown ids are 404", async () => {
    const staff = await signInAdmin();
    const customer = await signInCustomer();
    const booking = await book(customer.cookie, "yamaha-mt-15");
    const loan = await submittedLoan(customer.cookie);
    await patchJson("/api/v1/me", { phone: "+855 12 111 222", nationality: "Cambodian" }, { cookie: customer.cookie });

    const detail = (await json(await request(`/api/v1/admin/customers/${customer.userId}`, { cookie: staff.cookie }))).data;
    expect(detail.phone).toBe("+855 12 111 222");
    expect(detail.profile.nationality).toBe("Cambodian");
    expect(detail.recentBookings.map((b: { reference: string }) => b.reference)).toEqual([booking.reference]);
    expect(detail.recentLoans.map((l: { reference: string }) => l.reference)).toEqual([loan]);
    expect((await request("/api/v1/admin/customers/00000000-0000-4000-8000-000000000000", { cookie: staff.cookie })).status).toBe(404);
    expect((await request("/api/v1/admin/customers/not-a-uuid", { cookie: staff.cookie })).status).toBe(422);
  });
});
