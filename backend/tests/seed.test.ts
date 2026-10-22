import { describe, expect, test } from "bun:test";
import { count, inArray } from "drizzle-orm";
import { db } from "../src/libs/db";
import { seedAddons, seedCatalog, seedLocations, seedVehicles } from "../src/libs/db/seed";
import { bookingAddons, locations, vehicles } from "../src/libs/db/schema";

describe("seed", () => {
  test("seeds the catalogue and is idempotent", async () => {
    await seedCatalog();
    await seedCatalog();
    const [l] = await db.select({ n: count() }).from(locations).where(inArray(locations.name, seedLocations.map((x) => x.name)));
    const [v] = await db.select({ n: count() }).from(vehicles).where(inArray(vehicles.slug, seedVehicles.map((x) => x.slug)));
    const [a] = await db.select({ n: count() }).from(bookingAddons).where(inArray(bookingAddons.code, seedAddons.map((x) => x.code)));
    expect(l?.n).toBe(seedLocations.length);
    expect(v?.n).toBe(seedVehicles.length);
    expect(a?.n).toBe(seedAddons.length);
  });

  test("every seeded price is a positive integer in minor units", () => {
    for (const vehicle of seedVehicles) {
      expect(Number.isInteger(vehicle.dailyRentalPriceMinor)).toBe(true);
      expect(vehicle.dailyRentalPriceMinor).toBeGreaterThan(0);
      expect(Number.isInteger(vehicle.securityDepositMinor)).toBe(true);
    }
  });
});
