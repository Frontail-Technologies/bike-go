import "server-only";

import type { ApiEnvelope } from "@/lib/api/contracts";
import type { Vehicle, VehicleModelGroup } from "../types";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { next: { revalidate: 60 }, headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const body = await response.json() as ApiEnvelope<T>;
    return body.data;
  } catch {
    return null;
  }
}

export function getVehicleForMetadata(idOrSlug: string) {
  return getJson<Vehicle>(`/vehicles/${encodeURIComponent(idOrSlug)}`);
}

export function getVehicleModelForMetadata(groupSlug: string) {
  return getJson<VehicleModelGroup>(`/vehicles/models/${encodeURIComponent(groupSlug)}`);
}

export function primaryImageUrl(images: { url: string | null; isPrimary: boolean }[]): string | undefined {
  const primary = images.find((image) => image.isPrimary)?.url ?? images[0]?.url;
  return primary ?? undefined;
}
