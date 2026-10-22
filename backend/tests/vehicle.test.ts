import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { seedCatalog, seedVehicles } from "../src/libs/db/seed";
import { json } from "./helpers/http";
import { patchJson, postJson, request, signInAdmin, signInCustomer } from "./helpers/auth";
import { cleanupExtraVehicles } from "./helpers/db";

beforeAll(async () => {
  await seedCatalog();
});
afterAll(cleanupExtraVehicles);

const seeded = new Set(seedVehicles.map((v) => v.slug));
const listVehicles = async (query = "") => {
  const body = await json(await request(`/api/v1/vehicles${query}`));
  return { ...body, data: body.data.filter((v: { slug: string }) => seeded.has(v.slug)) };
};

describe("public catalogue", () => {
  test("lists active locations", async () => {
    const body = await json(await request("/api/v1/locations"));
    expect(body.success).toBe(true);
    expect(body.data.map((l: { city: string }) => l.city).sort()).toEqual(["Phnom Penh", "Siem Reap"]);
    const phnomPenh = await json(await request("/api/v1/locations?city=Phnom%20Penh"));
    expect(phnomPenh.data.length).toBe(1);
  });

  test("lists vehicles with pagination meta and no internal fields", async () => {
    const body = await listVehicles();
    expect(body.data.length).toBe(6);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 20 });
    expect(body.meta.total).toBeGreaterThanOrEqual(6);
    const text = JSON.stringify(body);
    expect(text).not.toContain("registrationNumber");
    expect(text).not.toContain("storageKey");
    expect(body.data[0]).toMatchObject({ currency: "USD" });
    expect(Number.isInteger(body.data[0].dailyRentalPriceMinor)).toBe(true);
  });

  test("filters by category, brand, type, transmission, price and engine", async () => {
    expect((await listVehicles("?category=sport")).data.map((v: { slug: string }) => v.slug).sort()).toEqual(["ktm-duke-200", "yamaha-mt-15"]);
    expect((await listVehicles("?brand=royal%20enfield")).data.length).toBe(3);
    expect((await listVehicles("?vehicleType=scooter")).data.map((v: { slug: string }) => v.slug)).toEqual(["honda-activa"]);
    expect((await listVehicles("?transmission=automatic")).data.length).toBe(1);
    expect((await listVehicles("?minPrice=2200&maxPrice=2500")).data.length).toBe(3);
    expect((await listVehicles("?minEngineCc=300")).data.length).toBe(3);
    expect((await listVehicles("?maxEngineCc=155")).data.length).toBe(2);
  });

  test("filters by location", async () => {
    const locations = (await json(await request("/api/v1/locations"))).data as { id: string; city: string }[];
    const siemReap = locations.find((l) => l.city === "Siem Reap")!;
    const body = await listVehicles(`?locationId=${siemReap.id}`);
    expect(body.data.map((v: { slug: string }) => v.slug).sort()).toEqual(["honda-activa", "royal-enfield-hunter-350"]);
  });

  test("sorts and paginates", async () => {
    const asc = (await listVehicles("?sort=price_asc")).data.map((v: { dailyRentalPriceMinor: number }) => v.dailyRentalPriceMinor);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = (await listVehicles("?sort=price_desc")).data.map((v: { dailyRentalPriceMinor: number }) => v.dailyRentalPriceMinor);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const page2 = await json(await request("/api/v1/vehicles?pageSize=4&page=2"));
    expect(page2.meta).toMatchObject({ page: 2, pageSize: 4 });
    expect(page2.data.length).toBe(Math.min(4, page2.meta.total - 4));
    expect(page2.meta.totalPages).toBe(Math.ceil(page2.meta.total / 4));
  });

  test("availability filtering needs both dates and a valid period", async () => {
    expect((await request("/api/v1/vehicles?pickupAt=2030-01-01T10:00:00Z")).status).toBe(422);
    expect((await request("/api/v1/vehicles?pickupAt=2030-01-02T10:00:00Z&returnAt=2030-01-01T10:00:00Z")).status).toBe(422);
    const free = await listVehicles("?pickupAt=2030-01-01T10:00:00Z&returnAt=2030-01-03T10:00:00Z");
    expect(free.data.length).toBe(6);
  });

  test("a vehicle is found by slug or by id, and unknown ones are 404", async () => {
    const bySlug = await json(await request("/api/v1/vehicles/yamaha-mt-15"));
    expect(bySlug.data).toMatchObject({ slug: "yamaha-mt-15", brand: "Yamaha", engineCc: 155, location: { city: "Phnom Penh" } });
    expect(bySlug.data.images.length).toBe(1);
    const byId = await json(await request(`/api/v1/vehicles/${bySlug.data.id}`));
    expect(byId.data.slug).toBe("yamaha-mt-15");
    const missing = await request("/api/v1/vehicles/not-a-bike");
    expect(missing.status).toBe(404);
    expect(await json(missing)).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  test("invalid query values are 422", async () => {
    expect((await request("/api/v1/vehicles?minPrice=abc")).status).toBe(422);
    expect((await request("/api/v1/vehicles?vehicleType=boat")).status).toBe(422);
    expect((await request("/api/v1/vehicles?pageSize=500")).status).toBe(422);
  });
});

describe("admin catalogue", () => {
  const newVehicle = (overrides: Record<string, unknown> = {}) => ({
    slug: `test-bike-${Math.random().toString(36).slice(2, 8)}`,
    vehicleType: "motorcycle",
    name: "Test Bike 250",
    brand: "Honda",
    model: "CB250",
    category: "commuter",
    dailyRentalPriceMinor: 1800,
    securityDepositMinor: 20000,
    currency: "USD",
    registrationNumber: `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    ...overrides,
  });

  test("customers and anonymous callers are kept out", async () => {
    const { cookie } = await signInCustomer();
    expect((await request("/api/v1/admin/vehicles")).status).toBe(401);
    expect((await request("/api/v1/admin/vehicles", { cookie })).status).toBe(403);
    expect((await postJson("/api/v1/admin/vehicles", newVehicle(), { cookie })).status).toBe(403);
  });

  test("an admin creates, reads, updates and deletes a vehicle", async () => {
    const { cookie } = await signInAdmin();
    const location = (await json(await request("/api/v1/locations"))).data[0] as { id: string };

    const created = await postJson("/api/v1/admin/vehicles", newVehicle({ locationId: location.id, images: [{ storageKey: "vehicles/test/main.jpg" }] }), { cookie });
    expect(created.status).toBe(200);
    const vehicle = (await json(created)).data;
    expect(vehicle.registrationNumber).toMatch(/^TST-/);
    expect(vehicle.images.length).toBe(1);

    const updated = await patchJson(`/api/v1/admin/vehicles/${vehicle.id}`, { dailyRentalPriceMinor: 2100, status: "maintenance" }, { cookie });
    expect(updated.status).toBe(200);
    expect((await json(updated)).data).toMatchObject({ dailyRentalPriceMinor: 2100, status: "maintenance" });

    const listed = await json(await request("/api/v1/admin/vehicles?status=maintenance", { cookie }));
    expect(listed.data.some((v: { id: string }) => v.id === vehicle.id)).toBe(true);

    const removed = await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie, method: "DELETE" });
    expect(await json(removed)).toMatchObject({ data: { deleted: true, deactivated: false } });
    expect((await request(`/api/v1/admin/vehicles/${vehicle.id}`, { cookie })).status).toBe(404);
  });

  test("duplicate slug or registration and unknown location are 422, not 500", async () => {
    const { cookie } = await signInAdmin();
    const location = (await json(await request("/api/v1/locations"))).data[0] as { id: string };

    const first = newVehicle({ locationId: location.id });
    expect((await postJson("/api/v1/admin/vehicles", first, { cookie })).status).toBe(200);
    expect((await postJson("/api/v1/admin/vehicles", { ...first, registrationNumber: "OTHER-1" }, { cookie })).status).toBe(422);
    expect((await postJson("/api/v1/admin/vehicles", { ...first, slug: "another-slug" }, { cookie })).status).toBe(422);
    expect((await postJson("/api/v1/admin/vehicles", newVehicle({ locationId: "00000000-0000-4000-8000-000000000000" }), { cookie })).status).toBe(422);
    expect((await postJson("/api/v1/admin/vehicles", newVehicle({ locationId: location.id, dailyRentalPriceMinor: 0 }), { cookie })).status).toBe(422);
  });

  test("locations can be created and deactivated, and inactive ones leave the public list", async () => {
    const { cookie } = await signInAdmin();
    const created = await postJson("/api/v1/admin/locations", { name: "RideGo Sihanoukville Beach", address: "Serendipity Beach Rd", city: "Sihanoukville" }, { cookie });
    const location = (await json(created)).data;
    expect(location).toMatchObject({ city: "Sihanoukville", active: true });
    expect((await json(await request("/api/v1/locations"))).data.some((l: { id: string }) => l.id === location.id)).toBe(true);

    await patchJson(`/api/v1/admin/locations/${location.id}`, { active: false }, { cookie });
    expect((await json(await request("/api/v1/locations"))).data.some((l: { id: string }) => l.id === location.id)).toBe(false);
    expect((await json(await request("/api/v1/admin/locations", { cookie }))).data.some((l: { id: string }) => l.id === location.id)).toBe(true);
  });
});
