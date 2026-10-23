import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { createdAt, id } from "./columns";

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (table) => [index("audit_log_created_idx").on(table.createdAt), index("audit_log_actor_idx").on(table.actorId, table.createdAt), index("audit_log_resource_idx").on(table.resourceType, table.resourceId)],
);
