import { asc, eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { vehicleImages } from "@/libs/db/schema";
import { PUBLIC_IMAGE_CACHE, storedImageResponse } from "@/libs/uploads/respond";
import { apiUrl } from "@/libs/urls";

type ImageRow = { id: string; publicUrl: string | null; contentType: string | null; altText: string | null; sortOrder: number };

export const MAX_VEHICLE_IMAGES = 10;

export const vehicleImageUrl = (row: Pick<ImageRow, "id" | "publicUrl" | "contentType">) =>
  row.publicUrl ?? (row.contentType ? apiUrl(`/api/v1/vehicles/images/${row.id}`) : null);

export const vehicleImageColumns = {
  id: vehicleImages.id,
  vehicleId: vehicleImages.vehicleId,
  publicUrl: vehicleImages.publicUrl,
  contentType: vehicleImages.contentType,
  altText: vehicleImages.altText,
  sortOrder: vehicleImages.sortOrder,
};

export function presentImages<T extends ImageRow & { vehicleId: string }>(rows: T[], vehicleId: string) {
  return rows
    .filter((row) => row.vehicleId === vehicleId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row, index) => ({ id: row.id, url: vehicleImageUrl(row), altText: row.altText, sortOrder: row.sortOrder, isPrimary: index === 0 }));
}

export async function vehicleImageFile(imageId: string) {
  const [row] = await db.select().from(vehicleImages).where(eq(vehicleImages.id, imageId)).orderBy(asc(vehicleImages.sortOrder)).limit(1);
  if (!row || !row.contentType) throw new AppError("NOT_FOUND", 404, "Image not found.");
  return storedImageResponse(row.storageKey, row.contentType, PUBLIC_IMAGE_CACHE);
}
