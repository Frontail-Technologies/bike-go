import { t } from "elysia";
import { Envelope } from "@/libs/api";
import { Location } from "@/routes/location/model";

export const LocationsGet = { Response: Envelope(t.Array(Location)) };

export const LocationPost = {
  Body: t.Object({
    name: t.String({ minLength: 2, maxLength: 120 }),
    address: t.String({ minLength: 3, maxLength: 300 }),
    city: t.String({ minLength: 2, maxLength: 80 }),
    latitude: t.Optional(t.Nullable(t.Number({ minimum: -90, maximum: 90 }))),
    longitude: t.Optional(t.Nullable(t.Number({ minimum: -180, maximum: 180 }))),
    active: t.Optional(t.Boolean()),
  }),
  Response: Envelope(Location),
};

export const LocationPatch = {
  Params: t.Object({ id: t.String({ format: "uuid" }) }),
  Body: t.Partial(LocationPost.Body),
  Response: Envelope(Location),
};
