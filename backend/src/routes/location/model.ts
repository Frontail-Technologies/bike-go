import { t } from "elysia";
import { Envelope } from "@/libs/api";

export const Location = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  address: t.String(),
  city: t.String(),
  latitude: t.Nullable(t.Number()),
  longitude: t.Nullable(t.Number()),
  active: t.Boolean(),
});

export const LocationsGet = { Response: Envelope(t.Array(Location)) };
