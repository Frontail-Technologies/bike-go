import { and, asc, eq } from "drizzle-orm";
import { db } from "@/libs/db";
import { banners } from "@/libs/db/schema";
import { isLiveSql } from "./status";
import type { BannerRow, BannersGet } from "./types";

export const publicBanner = (row: BannerRow) => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  imageUrl: row.imageUrl,
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
