import { index, integer, jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id, timestamptz } from "./columns";

/**
 * Replay protection for operations a client may retry (creating a booking, submitting a loan). The row is
 * written in the same transaction as the operation, so a retry either sees the stored response or waits on
 * the unique index until the first attempt commits.
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: id(),
    key: text("key").notNull(),
    scope: text("scope").notNull(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    requestHash: text("request_hash").notNull(),
    responseCode: integer("response_code"),
    responseBody: jsonb("response_body").$type<unknown>(),
    expiresAt: timestamptz("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (table) => [unique("idempotency_keys_scope_key_unique").on(table.scope, table.key), index("idempotency_keys_expires_idx").on(table.expiresAt)],
);
