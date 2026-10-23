import { AppError } from "@/libs/api";
import { storage } from "@/providers/storage";

export async function storedImageResponse(key: string, contentType: string, cacheControl: string) {
  const bytes = await storage.get(key);
  if (!bytes) throw new AppError("NOT_FOUND", 404, "The image is no longer available.");
  return new Response(bytes as BodyInit, { headers: { "content-type": contentType, "cache-control": cacheControl, "x-content-type-options": "nosniff", "content-length": String(bytes.byteLength) } });
}

export const PUBLIC_IMAGE_CACHE = "public, max-age=300";
export const PRIVATE_IMAGE_CACHE = "private, no-store";
