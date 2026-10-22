import { boolean, doublePrecision, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./columns";

export const locations = pgTable("locations", {
  id: id(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
