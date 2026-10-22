import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id, timestamptz } from "./columns";
import { currency } from "./enums";

export const fxRates = pgTable(
  "fx_rates",
  {
    id: id(),
    baseCurrency: currency("base_currency").notNull(),
    quoteCurrency: currency("quote_currency").notNull(),
    rate: numeric("rate", { precision: 20, scale: 8 }).notNull(),
    source: text("source").notNull(),
    effectiveAt: timestamptz("effective_at").notNull(),
    createdBy: uuid("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (table) => [
    unique("fx_rates_pair_effective_unique").on(table.baseCurrency, table.quoteCurrency, table.effectiveAt),
    index("fx_rates_lookup_idx").on(table.baseCurrency, table.quoteCurrency, table.effectiveAt),
    check("fx_rates_distinct_currencies", sql`${table.baseCurrency} <> ${table.quoteCurrency}`),
    check("fx_rates_rate_positive", sql`${table.rate} > 0`),
  ],
);
