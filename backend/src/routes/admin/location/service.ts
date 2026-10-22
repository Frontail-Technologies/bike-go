import { asc, eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { locations } from "@/libs/db/schema";
import { getLocationOrThrow } from "@/routes/location/service";
import { compact } from "@/libs/object";
import type { LocationCreateInput, LocationPatchInput } from "./types";

export async function adminListLocations() {
  return db
    .select({ id: locations.id, name: locations.name, address: locations.address, city: locations.city, latitude: locations.latitude, longitude: locations.longitude, active: locations.active })
    .from(locations)
    .orderBy(asc(locations.city), asc(locations.name));
}

export async function createLocation(input: LocationCreateInput) {
  const [created] = await db.insert(locations).values(input).returning({ id: locations.id });
  return getLocationOrThrow(created!.id);
}

export async function updateLocation(id: string, patch: LocationPatchInput) {
  const changes = compact(patch);
  const [existing] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, id)).limit(1);
  if (!existing) throw new AppError("NOT_FOUND", 404, "Location not found.");
  if (Object.keys(changes).length > 0) await db.update(locations).set(changes).where(eq(locations.id, id));
  return getLocationOrThrow(id);
}
