import { sql } from "drizzle-orm";
import { banners } from "@/libs/db/schema";
import type { BannerStatus } from "./types";

export const effectiveStatusSql = sql<BannerStatus>`CASE
  WHEN ${banners.status} IN ('inactive', 'expired') THEN ${banners.status}::text
  WHEN ${banners.endAt} IS NOT NULL AND ${banners.endAt} <= now() THEN 'expired'
  WHEN ${banners.startAt} IS NOT NULL AND ${banners.startAt} > now() THEN 'scheduled'
  ELSE 'active'
END`;

export const isLiveSql = sql`${effectiveStatusSql} = 'active'`;

export function effectiveStatusOf(row: { status: BannerStatus; startAt: Date | null; endAt: Date | null }, now = new Date()): BannerStatus {
  if (row.status === "inactive" || row.status === "expired") return row.status;
  if (row.endAt && row.endAt <= now) return "expired";
  if (row.startAt && row.startAt > now) return "scheduled";
  return "active";
}
