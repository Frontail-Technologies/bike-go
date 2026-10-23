import { index, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, timestamptz } from "./columns";

export const telegramLogins = pgTable(
  "telegram_logins",
  {
    hash: text("hash").primaryKey(),
    expiresAt: timestamptz("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("telegram_logins_expires_idx").on(table.expiresAt)],
);
