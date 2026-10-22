import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db, type Executor } from "@/libs/db";
import { PG, pgConstraint, pgErrorCode } from "@/libs/db/errors";
import { bookings, locations, vehicleBlocks, vehicleImages, vehicles } from "@/libs/db/schema";
import { pageMeta, pageOf } from "@/libs/pagination";
import { assertInterval, busyPeriods } from "@/routes/availability/service";
import { vehicleSearch } from "@/routes/vehicle/service";
import type { BlockPost, VehiclePatch, VehiclePost, VehiclesGet } from "./model";

async function adminShape(executor: Executor, ids: string[]) {
  if (ids.length === 0) return [];
  const [rows, images] = await Promise.all([
    executor
      .select({ vehicle: vehicles, locationName: locations.name, locationCity: locations.city, locationAddress: locations.address })
      .from(vehicles)
      .innerJoin(locations, eq(vehicles.locationId, locations.id))
      .where(inArray(vehicles.id, ids)),
    executor
      .select({ id: vehicleImages.id, vehicleId: vehicleImages.vehicleId, url: vehicleImages.publicUrl, altText: vehicleImages.altText, sortOrder: vehicleImages.sortOrder })
      .from(vehicleImages)
      .where(inArray(vehicleImages.vehicleId, ids))
      .orderBy(asc(vehicleImages.sortOrder)),
  ]);
  return rows.map(({ vehicle, locationName, locationCity, locationAddress }) => {
    const { locationId, createdAt, updatedAt, ...rest } = vehicle;
    return {
      ...rest,
      registrationNumber: vehicle.registrationNumber,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      location: { id: locationId, name: locationName, city: locationCity, address: locationAddress },
      images: images.filter((i) => i.vehicleId === vehicle.id).map(({ vehicleId: _v, ...image }) => image),
    };
  });
}

function mapWriteError(error: unknown): never {
  const code = pgErrorCode(error);
  if (code === PG.uniqueViolation) {
    const constraint = pgConstraint(error) ?? "";
    const field = constraint.includes("registration") ? "registrationNumber" : "slug";
    throw new AppError("VALIDATION_ERROR", 422, `That ${field === "slug" ? "slug" : "registration number"} is already used by another vehicle.`, [{ path: field, message: "Already in use." }]);
  }
  if (code === PG.foreignKeyViolation) throw new AppError("VALIDATION_ERROR", 422, "The location does not exist.", [{ path: "locationId", message: "Unknown location." }]);
  if (code === PG.checkViolation) throw new AppError("VALIDATION_ERROR", 422, "A value is out of its allowed range.");
  throw error;
}

export async function adminListVehicles(query: VehiclesGet["Query"]) {
  const paging = pageOf(query);
  const where = and(
    query.q ? vehicleSearch(query.q) : undefined,
    query.status ? eq(vehicles.status, query.status) : undefined,
    query.locationId ? eq(vehicles.locationId, query.locationId) : undefined,
    query.vehicleType ? eq(vehicles.vehicleType, query.vehicleType) : undefined,
  );
  const [ids, [total]] = await Promise.all([
    db.select({ id: vehicles.id }).from(vehicles).where(where).orderBy(desc(vehicles.createdAt)).limit(paging.limit).offset(paging.offset),
    db.select({ n: count() }).from(vehicles).where(where),
  ]);
  const shaped = await adminShape(db, ids.map((r) => r.id));
  const order = new Map(ids.map((r, i) => [r.id, i]));
  return { data: shaped.sort((a, b) => order.get(a.id)! - order.get(b.id)!), meta: pageMeta(paging, total?.n ?? 0) };
}

export async function adminGetVehicle(id: string) {
  const [vehicle] = await adminShape(db, [id]);
  if (!vehicle) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  return vehicle;
}

export async function createVehicle(input: VehiclePost["Body"]) {
  const { images, ...fields } = input;
  try {
    const id = await db.transaction(async (tx) => {
      const [created] = await tx.insert(vehicles).values(fields).returning({ id: vehicles.id });
      if (images?.length) {
        await tx.insert(vehicleImages).values(images.map((image, i) => ({ vehicleId: created!.id, storageKey: image.storageKey, publicUrl: image.publicUrl ?? null, altText: image.altText ?? null, sortOrder: image.sortOrder ?? i })));
      }
      return created!.id;
    });
    return adminGetVehicle(id);
  } catch (error) {
    return mapWriteError(error);
  }
}

export async function updateVehicle(id: string, patch: VehiclePatch["Body"]) {
  const { images, ...fields } = patch;
  const changes = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, id)).limit(1);
      if (!existing) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
      if (Object.keys(changes).length > 0) await tx.update(vehicles).set(changes).where(eq(vehicles.id, id));
      if (images) {
        await tx.delete(vehicleImages).where(eq(vehicleImages.vehicleId, id));
        if (images.length) {
          await tx.insert(vehicleImages).values(images.map((image, i) => ({ vehicleId: id, storageKey: image.storageKey, publicUrl: image.publicUrl ?? null, altText: image.altText ?? null, sortOrder: image.sortOrder ?? i })));
        }
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    mapWriteError(error);
  }
  return adminGetVehicle(id);
}

export async function removeVehicle(id: string) {
  const [existing] = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, id)).limit(1);
  if (!existing) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  const [referenced] = await db.select({ n: count() }).from(bookings).where(eq(bookings.vehicleId, id));
  if ((referenced?.n ?? 0) > 0) {
    await db.update(vehicles).set({ status: "inactive" }).where(eq(vehicles.id, id));
    return { id, deleted: false, deactivated: true };
  }
  await db.delete(vehicles).where(eq(vehicles.id, id));
  return { id, deleted: true, deactivated: false };
}

export async function listBlocks(vehicleId: string) {
  await adminGetVehicle(vehicleId);
  const rows = await db.select().from(vehicleBlocks).where(eq(vehicleBlocks.vehicleId, vehicleId)).orderBy(asc(vehicleBlocks.startAt));
  return rows.map((b) => ({ id: b.id, vehicleId: b.vehicleId, startAt: b.startAt.toISOString(), endAt: b.endAt.toISOString(), reason: b.reason }));
}

export async function createBlock(vehicleId: string, input: BlockPost["Body"]) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  assertInterval(startAt, endAt);

  return db.transaction(async (tx) => {
    const locked = await tx.execute(sql`select id from ${vehicles} where ${vehicles.id} = ${vehicleId} for update`);
    if (!(Array.isArray(locked) ? locked : (locked as { rows: unknown[] }).rows).length) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

    const clashes = (await busyPeriods(tx, vehicleId, startAt, endAt)).filter((p) => p.kind === "booking");
    if (clashes.length > 0) {
      throw new AppError("BOOKING_CONFLICT", 409, "Bookings already exist in that period. Cancel or move them before blocking the vehicle.", {
        bookings: clashes.map((c) => ({ start: c.start.toISOString(), end: c.end.toISOString() })),
      });
    }
    const [block] = await tx.insert(vehicleBlocks).values({ vehicleId, startAt, endAt, reason: input.reason }).returning();
    return { id: block!.id, vehicleId, startAt: startAt.toISOString(), endAt: endAt.toISOString(), reason: block!.reason };
  });
}

export async function deleteBlock(vehicleId: string, blockId: string) {
  const deleted = await db.delete(vehicleBlocks).where(and(eq(vehicleBlocks.id, blockId), eq(vehicleBlocks.vehicleId, vehicleId))).returning({ id: vehicleBlocks.id });
  if (deleted.length === 0) throw new AppError("NOT_FOUND", 404, "Block not found.");
  return { id: blockId };
}
