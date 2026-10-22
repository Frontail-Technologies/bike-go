import { date, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id, updatedAt } from "./columns";

/**
 * What the app knows about a customer beyond sign-in. Identity, sessions and provider links stay in the
 * Better Auth tables; this holds only profile data the auth tables do not own.
 */
export const customerProfiles = pgTable("customer_profiles", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  telegramUsername: text("telegram_username"),
  avatarUrl: text("avatar_url"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  nationality: text("nationality"),
  address: text("address"),
  city: text("city"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
