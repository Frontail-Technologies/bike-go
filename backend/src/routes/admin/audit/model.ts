import { t } from "elysia";
import { Envelope, PaginationQuery } from "@/libs/api";

export const AuditEntry = t.Object({
  id: t.String({ format: "uuid" }),
  createdAt: t.String({ format: "date-time" }),
  actor: t.Nullable(t.Object({ id: t.String({ format: "uuid" }), name: t.String() })),
  action: t.String({ description: "For example vehicle.update or loan.status" }),
  resourceType: t.String(),
  resourceId: t.Nullable(t.String()),
  details: t.Nullable(t.Record(t.String(), t.Unknown())),
  ip: t.Nullable(t.String()),
});

export const AuditGet = {
  Query: t.Object({
    ...PaginationQuery.properties,
    actorId: t.Optional(t.String({ format: "uuid" })),
    action: t.Optional(t.String({ minLength: 1, maxLength: 80, description: "Exact action, or a prefix ending in a dot such as vehicle." })),
    resourceType: t.Optional(t.String({ minLength: 1, maxLength: 60 })),
    resourceId: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
    from: t.Optional(t.String({ format: "date-time" })),
    to: t.Optional(t.String({ format: "date-time" })),
  }),
  Response: Envelope(t.Array(AuditEntry)),
};
