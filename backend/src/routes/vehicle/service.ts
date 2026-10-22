import { and, asc, count, desc, eq, gte, ilike, inArray, lte, not, or, type SQL } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { locations, vehicleImages, vehicles } from "@/libs/db/schema";
import { pageMeta, pageOf } from "@/libs/pagination";
import { assertInterval, blockOverlap, bookingOverlap } from "../availability/service";
import type { PublicVehicle, VehiclesGet } from "./model";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const columns = {
  id: vehicles.id,
  slug: vehicles.slug,
  vehicleType: vehicles.vehicleType,
  name: vehicles.name,
  brand: vehicles.brand,
  model: vehicles.model,
  category: vehicles.category,
  description: vehicles.description,
  engineCc: vehicles.engineCc,
  transmission: vehicles.transmission,
  fuelType: vehicles.fuelType,
  seats: vehicles.seats,
  dailyRentalPriceMinor: vehicles.dailyRentalPriceMinor,
  securityDepositMinor: vehicles.securityDepositMinor,
  currency: vehicles.currency,
  status: vehicles.status,
  specifications: vehicles.specifications,
  locationId: locations.id,
  locationName: locations.name,
  locationCity: locations.city,
  locationAddress: locations.address,
};

const selectJoined = () => db.select(columns).from(vehicles).innerJoin(locations, eq(vehicles.locationId, locations.id));
type Row = Awaited<ReturnType<ReturnType<typeof selectJoined>["limit"]>>[number];


/** Attaches images and reshapes rows into the public contract. Registration numbers and storage keys never leave here. */
async function present(executor: Executor, rows: Row[]): Promise<PublicVehicle[]> {
  if (rows.length === 0) return [];
  const images = await executor
    .select({ id: vehicleImages.id, vehicleId: vehicleImages.vehicleId, url: vehicleImages.publicUrl, altText: vehicleImages.altText, sortOrder: vehicleImages.sortOrder })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, rows.map((r) => r.id)))
    .orderBy(asc(vehicleImages.sortOrder));

  return rows.map(({ locationId, locationName, locationCity, locationAddress, ...vehicle }) => ({
    ...vehicle,
    location: { id: locationId, name: locationName, city: locationCity, address: locationAddress },
    images: images.filter((image) => image.vehicleId === vehicle.id).map(({ vehicleId: _vehicleId, ...image }) => image),
  }));
}

export async function listVehicles(query: VehiclesGet["Query"], options: { includeInactive?: boolean } = {}) {
  const paging = pageOf(query);
  const conditions: (SQL | undefined)[] = [
    options.includeInactive ? undefined : not(eq(vehicles.status, "inactive")),
    query.locationId ? eq(vehicles.locationId, query.locationId) : undefined,
    query.vehicleType ? eq(vehicles.vehicleType, query.vehicleType) : undefined,
    query.category ? ilike(vehicles.category, query.category) : undefined,
    query.brand ? ilike(vehicles.brand, query.brand) : undefined,
    query.transmission ? ilike(vehicles.transmission, query.transmission) : undefined,
    query.minPrice !== undefined ? gte(vehicles.dailyRentalPriceMinor, query.minPrice) : undefined,
    query.maxPrice !== undefined ? lte(vehicles.dailyRentalPriceMinor, query.maxPrice) : undefined,
    query.minEngineCc !== undefined ? gte(vehicles.engineCc, query.minEngineCc) : undefined,
    query.maxEngineCc !== undefined ? lte(vehicles.engineCc, query.maxEngineCc) : undefined,
  ];

  if (query.pickupAt || query.returnAt) {
    if (!query.pickupAt || !query.returnAt) throw new AppError("VALIDATION_ERROR", 422, "Send both pickupAt and returnAt to filter by availability.");
    const start = new Date(query.pickupAt);
    const end = new Date(query.returnAt);
    assertInterval(start, end);
    conditions.push(not(eq(vehicles.status, "maintenance")), not(bookingOverlap(vehicles.id, start, end)), not(blockOverlap(vehicles.id, start, end)));
  }

  const where = and(...conditions);
  const order = {
    price_asc: [asc(vehicles.dailyRentalPriceMinor), asc(vehicles.name)],
    price_desc: [desc(vehicles.dailyRentalPriceMinor), asc(vehicles.name)],
    name: [asc(vehicles.name)],
    newest: [desc(vehicles.createdAt), asc(vehicles.name)],
  }[query.sort ?? "name"];

  const [rows, [total]] = await Promise.all([
    selectJoined().where(where).orderBy(...order).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(vehicles).where(where),
  ]);

  return { data: await present(db, rows), meta: pageMeta(paging, total?.n ?? 0) };
}

/** Finds a vehicle by slug or UUID. Public callers never see inactive vehicles. */
export async function getVehicle(idOrSlug: string, options: { includeInactive?: boolean } = {}) {
  const key = UUID.test(idOrSlug) ? eq(vehicles.id, idOrSlug) : eq(vehicles.slug, idOrSlug);
  const [row] = await db
    .select(columns)
    .from(vehicles)
    .innerJoin(locations, eq(vehicles.locationId, locations.id))
    .where(and(key, options.includeInactive ? undefined : not(eq(vehicles.status, "inactive"))))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  return (await present(db, [row]))[0]!;
}

/** Shared by admin routes: free-text search across the fields staff look for. */
export const vehicleSearch = (term: string) => or(ilike(vehicles.name, `%${term}%`), ilike(vehicles.brand, `%${term}%`), ilike(vehicles.model, `%${term}%`), ilike(vehicles.registrationNumber, `%${term}%`));
