import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, minor, timestamptz, updatedAt } from "./columns";
import { currency } from "./enums";
import { locations } from "./location";

export const vehicleType = pgEnum("vehicle_type", ["motorcycle", "scooter", "car", "other"]);
export const vehicleStatus = pgEnum("vehicle_status", ["available", "rented", "maintenance", "inactive"]);

/**
 * Generic rental vehicle (motorcycle, scooter, car...). Vehicle-specific attributes that not every type has
 * are nullable columns or live in `specifications`. `status` is the operational state; whether a vehicle is
 * free on given dates comes from bookings and blocks, never from `status` alone.
 */
export const vehicles = pgTable(
  "vehicles",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    vehicleType: vehicleType("vehicle_type").notNull().default("motorcycle"),
    name: text("name").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    engineCc: integer("engine_cc"),
    transmission: text("transmission"),
    fuelType: text("fuel_type"),
    seats: integer("seats"),
    dailyRentalPriceMinor: minor("daily_rental_price_minor").notNull(),
    securityDepositMinor: minor("security_deposit_minor").notNull(),
    currency: currency("currency").notNull().default("USD"),
    registrationNumber: text("registration_number").notNull().unique(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    status: vehicleStatus("status").notNull().default("available"),
    specifications: jsonb("specifications").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("vehicles_location_status_idx").on(table.locationId, table.status),
    index("vehicles_category_idx").on(table.category),
    check("vehicles_price_positive", sql`${table.dailyRentalPriceMinor} > 0`),
    check("vehicles_deposit_non_negative", sql`${table.securityDepositMinor} >= 0`),
  ],
);

export const vehicleImages = pgTable(
  "vehicle_images",
  {
    id: id(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url"),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("vehicle_images_vehicle_idx").on(table.vehicleId, table.sortOrder)],
);

/** Manual unavailability (maintenance, owner use). Overlapping bookings are refused while one exists. */
export const vehicleBlocks = pgTable(
  "vehicle_blocks",
  {
    id: id(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    startAt: timestamptz("start_at").notNull(),
    endAt: timestamptz("end_at").notNull(),
    reason: text("reason").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("vehicle_blocks_vehicle_period_idx").on(table.vehicleId, table.startAt, table.endAt),
    check("vehicle_blocks_period_valid", sql`${table.endAt} > ${table.startAt}`),
  ],
);
