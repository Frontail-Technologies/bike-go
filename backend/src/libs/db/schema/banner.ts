import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, timestamptz, updatedAt } from "./columns";

export const BANNER_PLACEMENTS = ["home_hero", "home_promo", "vehicles", "expat_loan"] as const;
export const BANNER_STATUSES = ["active", "scheduled", "inactive", "expired"] as const;

export const bannerPlacement = pgEnum("banner_placement", BANNER_PLACEMENTS);
export const bannerStatus = pgEnum("banner_status", BANNER_STATUSES);

export const banners = pgTable(
  "banners",
  {
    id: id(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    imageStorageKey: text("image_storage_key").notNull(),
    imageUrl: text("image_url"),
    ctaLabel: text("cta_label"),
    ctaUrl: text("cta_url"),
    placement: bannerPlacement("placement").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    status: bannerStatus("status").notNull().default("active"),
    startAt: timestamptz("start_at"),
    endAt: timestamptz("end_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("banners_placement_order_idx").on(table.placement, table.displayOrder),
    index("banners_status_idx").on(table.status),
    index("banners_display_order_idx").on(table.displayOrder),
    index("banners_window_idx").on(table.startAt, table.endAt),
    check("banners_window_valid", sql`${table.startAt} IS NULL OR ${table.endAt} IS NULL OR ${table.endAt} > ${table.startAt}`),
  ],
);
