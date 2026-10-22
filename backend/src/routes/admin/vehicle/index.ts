import { Elysia, t } from "elysia";
import { Envelope, ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as VehicleModel from "./model";
import { adminGetVehicle, adminListVehicles, createBlock, createVehicle, deleteBlock, listBlocks, removeVehicle, updateVehicle } from "./service";

export const adminVehicleRoutes = new Elysia({ name: "RideGo.Admin.Vehicle", prefix: "/vehicles", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: VehicleModel.VehiclesGet.Query, response: { 200: VehicleModel.VehiclesGet.Response, ...staffErrors }, detail: { summary: "List vehicles, including inactive", security: sessionSecurity } }, async ({ query }) => okPage(await adminListVehicles(query)))
  .post(
    "",
    { admin: true, body: VehicleModel.VehiclePost.Body, response: { 200: VehicleModel.VehiclePost.Response, ...staffErrors }, detail: { summary: "Create a vehicle", security: sessionSecurity } },
    async ({ body }) => ok(await createVehicle(body)),
  )
  .get("/:id", { admin: true, params: VehicleModel.VehicleByIdParams, response: { 200: VehicleModel.VehiclePost.Response, ...staffErrors }, detail: { summary: "One vehicle with its registration number", security: sessionSecurity } }, async ({ params }) => ok(await adminGetVehicle(params.id)))
  .patch(
    "/:id",
    { admin: true, params: VehicleModel.VehiclePatch.Params, body: VehicleModel.VehiclePatch.Body, response: { 200: VehicleModel.VehiclePatch.Response, ...staffErrors }, detail: { summary: "Update a vehicle", description: "Prices on existing bookings are snapshots and do not change.", security: sessionSecurity } },
    async ({ params, body }) => ok(await updateVehicle(params.id, body)),
  )
  .delete(
    "/:id",
    {
      admin: true,
      params: VehicleModel.VehicleDelete.Params,
      response: { 200: VehicleModel.VehicleDelete.Response, ...staffErrors },
      detail: { summary: "Delete a vehicle, or deactivate it when it has booking history", security: sessionSecurity },
    },
    async ({ params }) => ok(await removeVehicle(params.id)),
  )
  .get("/:id/blocks", { admin: true, params: VehicleModel.VehicleByIdParams, response: { 200: Envelope(t.Array(VehicleModel.Block)), ...staffErrors }, detail: { summary: "Maintenance and other blocks", security: sessionSecurity } }, async ({ params }) => ok(await listBlocks(params.id)))
  .post(
    "/:id/blocks",
    { admin: true, params: VehicleModel.BlockPost.Params, body: VehicleModel.BlockPost.Body, response: { 200: Envelope(VehicleModel.Block), ...staffErrors }, detail: { summary: "Block a vehicle for a period", description: "Refused with BOOKING_CONFLICT while a holding booking overlaps.", security: sessionSecurity } },
    async ({ params, body }) => ok(await createBlock(params.id, body)),
  )
  .delete(
    "/:id/blocks/:blockId",
    { admin: true, params: t.Object({ id: t.String({ format: "uuid" }), blockId: t.String({ format: "uuid" }) }), response: { 200: Envelope(t.Object({ id: t.String() })), ...staffErrors }, detail: { summary: "Remove a block", security: sessionSecurity } },
    async ({ params }) => ok(await deleteBlock(params.id, params.blockId)),
  );
