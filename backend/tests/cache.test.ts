import { beforeAll, describe, expect, test } from "bun:test";
import { db } from "../src/libs/db";
import { banners } from "../src/libs/db/schema";
import { seedCatalog } from "../src/libs/db/seed";
import { request } from "./helpers/auth";

beforeAll(async () => {
  await seedCatalog();
});

const CACHED = ["/api/v1/locations", "/api/v1/banners", "/api/v1/vehicles", "/api/v1/vehicles/honda-activa", "/api/v1/addons", "/api/v1/fx-rates/current?base=USD&quote=KHR"];

describe("public caching", () => {
  test("catalogue-style reads are cacheable and carry an ETag", async () => {
    for (const path of CACHED.slice(0, 5)) {
      const response = await request(path);
      expect({ path, status: response.status }).toEqual({ path, status: 200 });
      expect(response.headers.get("cache-control")).toMatch(/^public, max-age=\d+, stale-while-revalidate=\d+$/);
      expect(response.headers.get("etag")).toMatch(/^W\/"[0-9a-z]+"$/);
    }
  });

  test("the same content gives the same ETag, and If-None-Match returns an empty 304 with the usual headers", async () => {
    const first = await request("/api/v1/locations", { headers: { origin: "http://localhost:3000" } });
    const etag = first.headers.get("etag")!;
    expect((await request("/api/v1/locations")).headers.get("etag")).toBe(etag);

    const again = await request("/api/v1/locations", { headers: { "if-none-match": etag, origin: "http://localhost:3000" } });
    expect(again.status).toBe(304);
    expect(await again.text()).toBe("");
    expect(again.headers.get("etag")).toBe(etag);
    expect(again.headers.get("cache-control")).toBe(first.headers.get("cache-control"));
    expect(again.headers.get("x-content-type-options")).toBe("nosniff");
    expect(again.headers.get("x-request-id")).toBeTruthy();
    expect(again.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");

    const other = await request("/api/v1/locations", { headers: { "if-none-match": `W/"nope", ${etag}` } });
    expect(other.status).toBe(304);
    expect((await request("/api/v1/locations", { headers: { "if-none-match": 'W/"stale"' } })).status).toBe(200);
  });

  test("a change in the data changes the ETag", async () => {
    await db.delete(banners);
    const empty = (await request("/api/v1/banners")).headers.get("etag");
    await db.insert(banners).values({ title: "New", imageStorageKey: "banners/x/y.png", placement: "home_hero" });
    const filled = await request("/api/v1/banners");
    expect(filled.headers.get("etag")).not.toBe(empty);
    expect((await request("/api/v1/banners", { headers: { "if-none-match": empty! } })).status).toBe(200);
    await db.delete(banners);
  });

  test("date-filtered vehicle searches are never cached because availability moves", async () => {
    const q = encodeURIComponent;
    const response = await request(`/api/v1/vehicles?pickupAt=${q("2031-03-10T10:00:00.000Z")}&returnAt=${q("2031-03-12T10:00:00.000Z")}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBeNull();
    expect(response.headers.get("etag")).toBeNull();
    const availability = await request(`/api/v1/vehicles/honda-activa/availability?from=${q("2031-03-10T00:00:00.000Z")}&to=${q("2031-03-12T00:00:00.000Z")}`);
    expect(availability.headers.get("cache-control")).toBeNull();
  });

  test("errors and signed-in routes are not cached", async () => {
    const missing = await request("/api/v1/vehicles/not-a-real-vehicle");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("cache-control")).toBeNull();
    const me = await request("/api/v1/me");
    expect(me.status).toBe(401);
    expect(me.headers.get("cache-control")).toBeNull();
    const invalid = await request("/api/v1/banners?placement=sidebar");
    expect(invalid.status).toBe(422);
    expect(invalid.headers.get("cache-control")).toBeNull();
  });
});
