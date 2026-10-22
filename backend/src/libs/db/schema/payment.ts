import { sql } from "drizzle-orm";
import { check, index, jsonb, pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { bookings } from "./booking";
import { createdAt, id, minor, timestamptz, updatedAt } from "./columns";
import { currency } from "./enums";

export const paymentAttemptStatus = pgEnum("payment_attempt_status", ["pending", "paid", "failed"]);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    transactionId: text("transaction_id").notNull().unique(),
    amountMinor: minor("amount_minor").notNull(),
    currency: currency("currency").notNull(),
    status: paymentAttemptStatus("status").notNull().default("pending"),
    review: text("review"),
    providerResponse: jsonb("provider_response"),
    paidAt: timestamptz("paid_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("payments_booking_idx").on(table.bookingId, table.createdAt),
    uniqueIndex("payments_one_pending_per_booking").on(table.bookingId).where(sql`${table.status} = 'pending'`),
    check("payments_amount_positive", sql`${table.amountMinor} > 0`),
  ],
);

