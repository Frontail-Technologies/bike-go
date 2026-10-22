import { Elysia, t } from "elysia";
import { ok } from "@/libs/api";
import * as LocationModel from "./model";
import { listActiveLocations } from "./service";

export const locationRoutes = new Elysia({ name: "RideGo.Location", prefix: "/api/v1/locations", tags: ["Locations"] }).get(
  "",
  {
    query: t.Object({ city: t.Optional(t.String()) }),
    response: { 200: LocationModel.LocationsGet.Response },
    detail: { summary: "Active pickup and return locations" },
  },
  async ({ query }) => ok(await listActiveLocations(query.city)),
);
