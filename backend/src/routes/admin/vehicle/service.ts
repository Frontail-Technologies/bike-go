import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { AppError, invalid } from "@/libs/api";
import { db } from "@/libs/db";
import { PG, pgConstraint, pgErrorCode } from "@/libs/db/errors";
import { lockRows } from "@/libs/db/lock";
import { bookings, locations, vehicleBlocks, vehicleImages, vehicles } from "@/libs/db/schema";
import { compact } from "@/libs/object";
import { paginate } from "@/libs/pagination";
import { asFileList, inspectImage } from "@/libs/uploads/inspect";
import { commitOrDiscard, discardQuietly, uploadAll } from "@/libs/uploads/storage";
import { assertInterval, busyPeriods } from "@/routes/availability/service";
import { MAX_VEHICLE_IMAGES, presentImages, vehicleImageColumns } from "@/routes/vehicle/images";
import { vehicleSearch } from "@/routes/vehicle/service";
import type { Executor } from "@/libs/db/types";
import { blankToNull, parseIdList, parseSpecifications, planImages, primaryFirst } from "./images";
import type { BlockPost, VehiclePatch, VehiclePost, VehiclesGet } from "./types";

async function adminShape(executor: Executor, ids: string[]) {
  if (ids.length === 0) return [];
  const [rows, images] = await Promise.all([
    executor
      .select({ vehicle: vehicles, locationName: locations.name, locationCity: locations.city, locationAddress: locations.address })
      .from(vehicles)
      .innerJoin(locations, eq(vehicles.locationId, locations.id))
      .where(inArray(vehicles.id, ids)),
    executor.select(vehicleImageColumns).from(vehicleImages).where(inArray(vehicleImages.vehicleId, ids)).orderBy(asc(vehicleImages.sortOrder)),
  ]);
  return rows.map(({ vehicle, locationName, locationCity, locationAddress }) => {
    const { locationId, createdAt, updatedAt, ...rest } = vehicle;
    return {
      ...rest,
      registrationNumber: vehicle.registrationNumber,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      location: { id: locationId, name: locationName, city: locationCity, address: locationAddress },
      images: presentImages(images, vehicle.id),
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

const NOT_COLUMNS = new Set(["images", "primaryImageIndex", "removeImageIds", "imageOrder", "primaryImageId", "specifications", "description", "transmission", "fuelType"]);

type Columns = Partial<typeof vehicles.$inferInsert>;

function writableFields(input: VehiclePost["Body"] | VehiclePatch["Body"]): Columns {
  const columns = Object.fromEntries(Object.entries(input).filter(([name]) => !NOT_COLUMNS.has(name))) as Columns;
  return compact({
    ...columns,
    description: blankToNull(input.description),
    transmission: blankToNull(input.transmission),
    fuelType: blankToNull(input.fuelType),
    specifications: parseSpecifications(input.specifications),
  });
}

const imageKey = (vehicleId: string, extension: string) => `vehicles/${vehicleId}/${crypto.randomUUID()}.${extension}`;

export async function adminListVehicles(query: VehiclesGet["Query"]) {
  const where = and(
    query.q ? vehicleSearch(query.q) : undefined,
    query.status ? eq(vehicles.status, query.status) : undefined,
    query.locationId ? eq(vehicles.locationId, query.locationId) : undefined,
    query.vehicleType ? eq(vehicles.vehicleType, query.vehicleType) : undefined,
  );
  return paginate(query, {
    rows: (page) => db.select({ id: vehicles.id }).from(vehicles).where(where).orderBy(desc(vehicles.createdAt)).limit(page.limit).offset(page.offset),
    total: () => db.select({ n: count() }).from(vehicles).where(where),
    map: async (ids) => {
      const order = new Map(ids.map((r, i) => [r.id, i]));
      return (await adminShape(db, ids.map((r) => r.id))).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    },
  });
}

export async function adminGetVehicle(id: string) {
  const [vehicle] = await adminShape(db, [id]);
  if (!vehicle) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");
  return vehicle;
}

export async function createVehicle(input: VehiclePost["Body"]) {
  const fields = writableFields(input) as Omit<typeof vehicles.$inferInsert, "id">;
  const files = asFileList(input.images);
  if (input.primaryImageIndex !== undefined && input.primaryImageIndex >= files.length) throw invalid("primaryImageIndex", "There is no image at that position.");
  const uploads = await Promise.all(files.map((file) => inspectImage(file, "images")));

  const vehicleId = crypto.randomUUID();
  const ordered = primaryFirst(uploads, input.primaryImageIndex);
  const staged = ordered.map((upload) => ({ key: imageKey(vehicleId, upload.extension), upload }));
  const keys = await uploadAll(staged);

  try {
    await commitOrDiscard(keys, () =>
      db.transaction(async (tx) => {
        await tx.insert(vehicles).values({ ...fields, id: vehicleId });
        if (staged.length > 0) {
          await tx.insert(vehicleImages).values(
            staged.map(({ key, upload }, index) => ({
              vehicleId,
              storageKey: key,
              contentType: upload.contentType,
              sizeBytes: upload.bytes.byteLength,
              altText: fields.name,
              sortOrder: index,
            })),
          );
        }
      }),
    );
  } catch (error) {
    mapWriteError(error);
  }
  return adminGetVehicle(vehicleId);
}

export async function updateVehicle(id: string, patch: VehiclePatch["Body"]) {
  const [existing] = await db.select({ id: vehicles.id, name: vehicles.name }).from(vehicles).where(eq(vehicles.id, id)).limit(1);
  if (!existing) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

  const changes = writableFields(patch);
  const currentImages = await db.select({ id: vehicleImages.id, storageKey: vehicleImages.storageKey, sortOrder: vehicleImages.sortOrder }).from(vehicleImages).where(eq(vehicleImages.vehicleId, id));
  const newFiles = asFileList(patch.images);
  const remove = parseIdList("removeImageIds", patch.removeImageIds) ?? [];
  const newIds = newFiles.map(() => crypto.randomUUID());

  const finalOrder = planImages({ existing: currentImages, remove, order: parseIdList("imageOrder", patch.imageOrder), primaryId: patch.primaryImageId, newIds, primaryIndex: patch.primaryImageIndex });
  if (finalOrder.length > MAX_VEHICLE_IMAGES) throw invalid("images", `A vehicle can have at most ${MAX_VEHICLE_IMAGES} images.`);

  const uploads = await Promise.all(newFiles.map((file) => inspectImage(file, "images")));
  const staged = uploads.map((upload) => ({ key: imageKey(id, upload.extension), upload }));
  const keys = await uploadAll(staged);

  try {
    await commitOrDiscard(keys, () =>
      db.transaction(async (tx) => {
        await tx.update(vehicles).set({ ...changes, updatedAt: new Date() }).where(eq(vehicles.id, id));
        if (remove.length > 0) await tx.delete(vehicleImages).where(and(eq(vehicleImages.vehicleId, id), inArray(vehicleImages.id, remove)));
        if (staged.length > 0) {
          await tx.insert(vehicleImages).values(
            staged.map(({ key, upload }, index) => ({
              id: newIds[index]!,
              vehicleId: id,
              storageKey: key,
              contentType: upload.contentType,
              sizeBytes: upload.bytes.byteLength,
              altText: changes.name ?? existing.name,
              sortOrder: 0,
            })),
          );
        }
        for (const [index, imageId] of finalOrder.entries()) await tx.update(vehicleImages).set({ sortOrder: index }).where(eq(vehicleImages.id, imageId));
      }),
    );
  } catch (error) {
    mapWriteError(error);
  }

  await discardQuietly(currentImages.filter((image) => remove.includes(image.id)).map((image) => image.storageKey));
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
  const keys = (await db.select({ key: vehicleImages.storageKey }).from(vehicleImages).where(eq(vehicleImages.vehicleId, id))).map((row) => row.key);
  await db.delete(vehicles).where(eq(vehicles.id, id));
  await discardQuietly(keys);
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
    const locked = await lockRows(tx, vehicles, eq(vehicles.id, vehicleId));
    if (locked.length === 0) throw new AppError("NOT_FOUND", 404, "Vehicle not found.");

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
