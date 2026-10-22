import { asc, eq } from "drizzle-orm";
import type { UnwrapSchema } from "elysia";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { locations } from "@/libs/db/schema";
import { getLocationOrThrow } from "@/routes/location/service";
import type { LocationPatch, LocationPost } from "./model";

type CreateInput = UnwrapSchema<typeof LocationPost.Body>;
type PatchInput = UnwrapSchema<typeof LocationPatch.Body>;

export async function adminListLocations() {
  return db
    .select({ id: locations.id, name: locations.name, address: locations.address, city: locations.city, latitude: locations.latitude, longitude: locations.longitude, active: locations.active })
    .from(locations)
    .orderBy(asc(locations.city), asc(locations.name));
}

export async function createLocation(input: CreateInput) {
  const [created] = await db.insert(locations).values(input).returning({ id: locations.id });
  return getLocationOrThrow(created!.id);
}

export async function updateLocation(id: string, patch: PatchInput) {
  const changes = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
  const [existing] = await db.select({ id: locations.id }).from(locations).where(eq(locations.id, id)).limit(1);
  if (!existing) throw new AppError("NOT_FOUND", 404, "Location not found.");
  if (Object.keys(changes).length > 0) await db.update(locations).set(changes).where(eq(locations.id, id));
  return getLocationOrThrow(id);
}
