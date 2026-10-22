import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id, minor, timestamptz, updatedAt } from "./columns";
import { currency } from "./enums";
import { locations } from "./location";
import { vehicles } from "./vehicle";

export const bookingStatus = pgEnum("booking_status", ["pending", "confirmed", "ready_for_pickup", "active", "completed", "cancelled"]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "pending", "paid", "failed", "refunded", "partially_refunded"]);

/** Statuses that hold a vehicle for their period. Mirrored by the exclusion constraint in the migration. */
export const BLOCKING_BOOKING_STATUSES = ["confirmed", "ready_for_pickup", "active"] as const;

/** Optional extras sold per day (helmet, jacket...). Configurable data, not booking logic. */
export const bookingAddons = pgTable("booking_addons", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  pricePerDayMinor: minor("price_per_day_minor").notNull(),
  currency: currency("currency").notNull().default("USD"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * A rental. Every money field is a snapshot taken when the booking was made, so later price changes never
 * rewrite history. Totals are computed by the server; nothing here comes from the client.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    pickupLocationId: uuid("pickup_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    returnLocationId: uuid("return_location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    pickupAt: timestamptz("pickup_at").notNull(),
    returnAt: timestamptz("return_at").notNull(),
    rentalDays: integer("rental_days").notNull(),
    currency: currency("currency").notNull(),
    dailyRateSnapshotMinor: minor("daily_rate_snapshot_minor").notNull(),
    rentalSubtotalMinor: minor("rental_subtotal_minor").notNull(),
    addonsTotalMinor: minor("addons_total_minor").notNull().default(0),
    platformFeeMinor: minor("platform_fee_minor").notNull().default(0),
    securityDepositSnapshotMinor: minor("security_deposit_snapshot_minor").notNull().default(0),
    taxesMinor: minor("taxes_minor").notNull().default(0),
    totalPayableMinor: minor("total_payable_minor").notNull(),
    bookingStatus: bookingStatus("booking_status").notNull().default("confirmed"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    cancelledAt: timestamptz("cancelled_at"),
    cancellationReason: text("cancellation_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("bookings_user_created_idx").on(table.userId, table.createdAt),
    index("bookings_vehicle_period_idx").on(table.vehicleId, table.pickupAt, table.returnAt),
    index("bookings_status_idx").on(table.bookingStatus),
    check("bookings_period_valid", sql`${table.returnAt} > ${table.pickupAt}`),
    check("bookings_days_positive", sql`${table.rentalDays} >= 1`),
    check(
      "bookings_money_non_negative",
      sql`${table.rentalSubtotalMinor} >= 0 AND ${table.addonsTotalMinor} >= 0 AND ${table.platformFeeMinor} >= 0 AND ${table.securityDepositSnapshotMinor} >= 0 AND ${table.taxesMinor} >= 0 AND ${table.totalPayableMinor} >= 0`,
    ),
    // The "no double booking" exclusion constraint (gist) lives in the hand-written migration:
    //   EXCLUDE USING gist (vehicle_id WITH =, tstzrange(pickup_at, return_at, '[)') WITH &&)
    //   WHERE (booking_status IN ('confirmed', 'ready_for_pickup', 'active'))
    // Drizzle cannot express it, and the database is the last line of defence against races.
  ],
);

export const bookingAddonItems = pgTable(
  "booking_addon_items",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    addonId: uuid("addon_id")
      .notNull()
      .references(() => bookingAddons.id, { onDelete: "restrict" }),
    nameSnapshot: text("name_snapshot").notNull(),
    unitPriceSnapshotMinor: minor("unit_price_snapshot_minor").notNull(),
    currency: currency("currency").notNull(),
    quantity: integer("quantity").notNull().default(1),
    days: integer("days").notNull(),
    totalMinor: minor("total_minor").notNull(),
  },
  (table) => [index("booking_addon_items_booking_idx").on(table.bookingId), check("booking_addon_items_quantity_positive", sql`${table.quantity} >= 1`)],
);
