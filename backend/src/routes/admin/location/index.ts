import { Elysia } from "elysia";
import { ok, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as LocationModel from "./model";
import { adminListLocations, createLocation, updateLocation } from "./service";

export const adminLocationRoutes = new Elysia({ name: "RideGo.Admin.Location", prefix: "/locations", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, response: { 200: LocationModel.LocationsGet.Response, ...staffErrors }, detail: { summary: "All locations, including inactive", security: sessionSecurity } }, async () => ok(await adminListLocations()))
  .post("", { admin: true, body: LocationModel.LocationPost.Body, response: { 200: LocationModel.LocationPost.Response, ...staffErrors }, detail: { summary: "Create a location", security: sessionSecurity } }, async ({ body }) => ok(await createLocation(body)))
  .patch(
    "/:id",
    { admin: true, params: LocationModel.LocationPatch.Params, body: LocationModel.LocationPatch.Body, response: { 200: LocationModel.LocationPatch.Response, ...staffErrors }, detail: { summary: "Update or deactivate a location", security: sessionSecurity } },
    async ({ params, body }) => ok(await updateLocation(params.id, body)),
  );
