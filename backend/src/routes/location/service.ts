import { and, asc, eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { locations } from "@/libs/db/schema";

const publicColumns = {
  id: locations.id,
  name: locations.name,
  address: locations.address,
  city: locations.city,
  latitude: locations.latitude,
  longitude: locations.longitude,
  active: locations.active,
};

export async function listActiveLocations(city?: string) {
  return db
    .select(publicColumns)
    .from(locations)
    .where(and(eq(locations.active, true), city ? eq(locations.city, city) : undefined))
    .orderBy(asc(locations.city), asc(locations.name));
}

export async function getLocationOrThrow(id: string) {
  const [row] = await db.select(publicColumns).from(locations).where(eq(locations.id, id)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Location not found.");
  return row;
}
