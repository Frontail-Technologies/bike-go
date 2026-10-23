import { and, asc, eq } from "drizzle-orm";
import { AppError } from "@/libs/api";
import { db } from "@/libs/db";
import { banners } from "@/libs/db/schema";
import { PUBLIC_IMAGE_CACHE, storedImageResponse } from "@/libs/uploads/respond";
import { apiUrl } from "@/libs/urls";
import { effectiveStatusOf, isLiveSql } from "./status";
import type { BannerRow, BannersGet } from "./types";

export const bannerImagePath = (row: Pick<BannerRow, "id" | "updatedAt">, scope: "public" | "admin") =>
  apiUrl(`/api/v1/${scope === "admin" ? "admin/" : ""}banners/${row.id}/image?v=${row.updatedAt.getTime()}`);

export const publicBanner = (row: BannerRow) => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  imageUrl: bannerImagePath(row, "public"),
  ctaLabel: row.ctaLabel,
  ctaUrl: row.ctaUrl,
  placement: row.placement,
  displayOrder: row.displayOrder,
  startAt: row.startAt?.toISOString() ?? null,
  endAt: row.endAt?.toISOString() ?? null,
});

export async function listLiveBanners(query: BannersGet["Query"]) {
  const rows = await db
    .select()
    .from(banners)
    .where(and(isLiveSql, query.placement ? eq(banners.placement, query.placement) : undefined))
    .orderBy(asc(banners.displayOrder), asc(banners.createdAt), asc(banners.id));
  return rows.map(publicBanner);
}

export async function liveBannerImage(id: string) {
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!row || effectiveStatusOf(row) !== "active") throw new AppError("NOT_FOUND", 404, "Banner not found.");
  return storedImageResponse(row.imageStorageKey, row.imageContentType, PUBLIC_IMAGE_CACHE);
}
