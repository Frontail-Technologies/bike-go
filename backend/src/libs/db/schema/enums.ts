import { pgEnum } from "drizzle-orm/pg-core";

/** Currencies the business has said it will handle. Add a value here (and a migration) to support another. */
export const currency = pgEnum("currency", ["USD", "KHR"]);
