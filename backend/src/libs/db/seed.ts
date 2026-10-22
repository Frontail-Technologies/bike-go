import { eq } from "drizzle-orm";
import { env } from "@/env";
import { closeDb, db } from "./index";
import { bookingAddons, customerProfiles, locations, user, vehicleImages, vehicles } from "./schema";
import type { Executor, SeedVehicle } from "./types";

export const seedLocations = [
  { key: "phnom-penh", name: "RideGo Phnom Penh Riverside", address: "No. 12, Sisowath Quay, Daun Penh", city: "Phnom Penh", latitude: 11.5662, longitude: 104.9283 },
  { key: "siem-reap", name: "RideGo Siem Reap Old Market", address: "Street 9, near Old Market, Svay Dangkum", city: "Siem Reap", latitude: 13.3622, longitude: 103.8553 },
] as const;

export const seedVehicles: SeedVehicle[] = [
  {
    slug: "royal-enfield-classic-350",
    vehicleType: "motorcycle",
    name: "Royal Enfield Classic 350",
    brand: "Royal Enfield",
    model: "Classic 350",
    category: "cruiser",
    description: "Relaxed retro cruiser with a thumping single-cylinder engine. Comfortable for long city and countryside rides.",
    engineCc: 349,
    transmission: "manual",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 2500,
    securityDepositMinor: 30000,
    registrationNumber: "PP-2AA-1101",
    location: "phnom-penh",
    specifications: { powerBhp: 20.2, torqueNm: 27, weightKg: 195, fuelTankLitres: 13, abs: true, seatHeightMm: 805 },
  },
  {
    slug: "royal-enfield-himalayan",
    vehicleType: "motorcycle",
    name: "Royal Enfield Himalayan",
    brand: "Royal Enfield",
    model: "Himalayan",
    category: "adventure",
    description: "Tall, tough adventure tourer built for rough roads and long distances.",
    engineCc: 411,
    transmission: "manual",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 3500,
    securityDepositMinor: 40000,
    registrationNumber: "PP-2AA-1102",
    location: "phnom-penh",
    specifications: { powerBhp: 24.3, torqueNm: 32, weightKg: 199, fuelTankLitres: 15, abs: true, seatHeightMm: 800 },
  },
  {
    slug: "royal-enfield-hunter-350",
    vehicleType: "motorcycle",
    name: "Royal Enfield Hunter 350",
    brand: "Royal Enfield",
    model: "Hunter 350",
    category: "commuter",
    description: "Light, agile roadster that is easy to handle in traffic and fun on open roads.",
    engineCc: 349,
    transmission: "manual",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 2200,
    securityDepositMinor: 25000,
    registrationNumber: "SR-1BB-2201",
    location: "siem-reap",
    specifications: { powerBhp: 20.2, torqueNm: 27, weightKg: 177, fuelTankLitres: 13, abs: true, seatHeightMm: 790 },
  },
  {
    slug: "yamaha-mt-15",
    vehicleType: "motorcycle",
    name: "Yamaha MT-15",
    brand: "Yamaha",
    model: "MT-15",
    category: "sport",
    description: "Sharp naked sport bike with a rev-happy 155cc engine and upright, confident handling.",
    engineCc: 155,
    transmission: "manual",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 2000,
    securityDepositMinor: 20000,
    registrationNumber: "PP-2AA-1103",
    location: "phnom-penh",
    specifications: { powerBhp: 18.4, torqueNm: 14.1, weightKg: 141, fuelTankLitres: 10, abs: true, seatHeightMm: 810 },
  },
  {
    slug: "ktm-duke-200",
    vehicleType: "motorcycle",
    name: "KTM Duke 200",
    brand: "KTM",
    model: "Duke 200",
    category: "sport",
    description: "Punchy, lightweight naked bike for riders who want sporty performance in town.",
    engineCc: 199,
    transmission: "manual",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 2500,
    securityDepositMinor: 25000,
    registrationNumber: "PP-2AA-1104",
    location: "phnom-penh",
    specifications: { powerBhp: 24.8, torqueNm: 19.3, weightKg: 159, fuelTankLitres: 13.4, abs: true, seatHeightMm: 830 },
  },
  {
    slug: "honda-activa",
    vehicleType: "scooter",
    name: "Honda Activa",
    brand: "Honda",
    model: "Activa",
    category: "commuter",
    description: "Easy twist-and-go automatic scooter with storage under the seat. The simplest way around town.",
    engineCc: 110,
    transmission: "automatic",
    fuelType: "petrol",
    seats: 2,
    dailyRentalPriceMinor: 800,
    securityDepositMinor: 10000,
    registrationNumber: "SR-1BB-2202",
    location: "siem-reap",
    specifications: { powerBhp: 7.8, torqueNm: 8.8, weightKg: 106, fuelTankLitres: 5.3, abs: false, seatHeightMm: 710 },
  },
];

export const seedAddons = [
  { code: "helmet", name: "Helmet", description: "Certified full-face or open-face helmet.", pricePerDayMinor: 200 },
  { code: "riding-jacket", name: "Riding jacket", description: "Armoured riding jacket.", pricePerDayMinor: 200 },
] as const;

export async function seedCatalog(executor: Executor = db) {
  const locationIds = new Map<string, string>();
  for (const { key, ...row } of seedLocations) {
    const existing = (await executor.select({ id: locations.id }).from(locations).where(eq(locations.name, row.name)).limit(1))[0];
    if (existing) {
      await executor.update(locations).set(row).where(eq(locations.id, existing.id));
      locationIds.set(key, existing.id);
    } else {
      const [created] = await executor.insert(locations).values(row).returning({ id: locations.id });
      locationIds.set(key, created!.id);
    }
  }

  for (const { location, ...row } of seedVehicles) {
    const locationId = locationIds.get(location)!;
    const values = { ...row, locationId, currency: "USD" as const };
    const existing = (await executor.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.slug, row.slug)).limit(1))[0];
    if (existing) {
      await executor.update(vehicles).set(values).where(eq(vehicles.id, existing.id));
    } else {
      const [created] = await executor.insert(vehicles).values(values).returning({ id: vehicles.id });
      await executor.insert(vehicleImages).values({
        vehicleId: created!.id,
        storageKey: `vehicles/${row.slug}/main.jpg`,
        altText: row.name,
        sortOrder: 0,
      });
    }
  }

  for (const addon of seedAddons) {
    await executor
      .insert(bookingAddons)
      .values({ ...addon, currency: "USD" })
      .onConflictDoUpdate({ target: bookingAddons.code, set: { name: addon.name, description: addon.description, pricePerDayMinor: addon.pricePerDayMinor } });
  }
}

export async function seedAdmin(email: string, executor: Executor = db) {
  const existing = (await executor.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1))[0];
  if (existing) {
    await executor.update(user).set({ role: "super_admin" }).where(eq(user.id, existing.id));
    return existing.id;
  }
  const [created] = await executor.insert(user).values({ name: "RideGo Admin", email, emailVerified: true, role: "super_admin" }).returning({ id: user.id });
  await executor.insert(customerProfiles).values({ userId: created!.id, fullName: "RideGo Admin", email });
  return created!.id;
}

if (import.meta.main) {
  try {
    await seedCatalog();
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    if (adminEmail) await seedAdmin(adminEmail);
    console.log(`Seeded ${seedLocations.length} locations, ${seedVehicles.length} vehicles, ${seedAddons.length} add-ons${adminEmail ? ` and admin ${adminEmail}` : ""} (${env.NODE_ENV}).`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
