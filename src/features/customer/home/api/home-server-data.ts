import "server-only";

import type { ApiEnvelope } from "@/lib/api/contracts";
import type { BannerPlacement, HomeData, PublicBanner } from "../types";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");

async function readPublicData<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const body = await response.json() as ApiEnvelope<T>;
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export async function getHomeServerData() {
  return (await readPublicData<HomeData>("/home")) ?? { heroBanners: [], promoBanners: [], popularVehicles: [] };
}

export function getPublicBanners(placement: BannerPlacement) {
  return readPublicData<PublicBanner[]>(`/banners?placement=${encodeURIComponent(placement)}`).then((banners) => banners ?? []);
}
