import { t } from "elysia";
import { Envelope } from "@/libs/api";

export const AvailabilityGet = {
  Params: t.Object({ idOrSlug: t.String({ description: "Vehicle slug or UUID" }) }),
  Query: t.Object({
    from: t.String({ format: "date-time", description: "Start of the period to check (ISO-8601)" }),
    to: t.String({ format: "date-time", description: "End of the period to check; must be after `from`" }),
  }),
  Response: Envelope(
    t.Object({
      vehicleId: t.String({ format: "uuid" }),
      from: t.String({ format: "date-time" }),
      to: t.String({ format: "date-time" }),
      bookable: t.Boolean({ description: "True when the whole period is free and the vehicle can be rented" }),
      reason: t.Nullable(t.UnionEnum(["vehicle_unavailable", "period_taken"])),
      unavailablePeriods: t.Array(t.Object({ start: t.String({ format: "date-time" }), end: t.String({ format: "date-time" }), kind: t.UnionEnum(["booking", "block"]) })),
    }),
  ),
};
