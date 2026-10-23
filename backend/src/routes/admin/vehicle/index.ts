import { Elysia, t } from "elysia";
import { audit, changedFields } from "@/libs/audit";
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
    async ({ body, user, request, server }) => {
      const created = await createVehicle(body);
      await audit({ user, request, server }, "vehicle.create", { type: "vehicle", id: created.id, details: { imageCount: created.images.length } });
      return ok(created);
    },
  )
  .get("/:id", { admin: true, params: VehicleModel.VehicleByIdParams, response: { 200: VehicleModel.VehiclePost.Response, ...staffErrors }, detail: { summary: "One vehicle with its registration number", security: sessionSecurity } }, async ({ params }) => ok(await adminGetVehicle(params.id)))
  .patch(
    "/:id",
    { admin: true, params: VehicleModel.VehiclePatch.Params, body: VehicleModel.VehiclePatch.Body, response: { 200: VehicleModel.VehiclePatch.Response, ...staffErrors }, detail: { summary: "Update a vehicle", description: "Prices on existing bookings are snapshots and do not change.", security: sessionSecurity } },
    async ({ params, body, user, request, server }) => {
      const updated = await updateVehicle(params.id, body);
      await audit({ user, request, server }, "vehicle.update", { type: "vehicle", id: params.id, details: { fields: changedFields(body) } });
      return ok(updated);
    },
  )
  .delete(
    "/:id",
    {
      admin: true,
      params: VehicleModel.VehicleDelete.Params,
      response: { 200: VehicleModel.VehicleDelete.Response, ...staffErrors },
      detail: { summary: "Delete a vehicle, or deactivate it when it has booking history", security: sessionSecurity },
    },
    async ({ params, user, request, server }) => {
      const result = await removeVehicle(params.id);
      await audit({ user, request, server }, result.deleted ? "vehicle.delete" : "vehicle.deactivate", { type: "vehicle", id: params.id });
      return ok(result);
    },
  )
  .get("/:id/blocks", { admin: true, params: VehicleModel.VehicleByIdParams, response: { 200: Envelope(t.Array(VehicleModel.Block)), ...staffErrors }, detail: { summary: "Maintenance and other blocks", security: sessionSecurity } }, async ({ params }) => ok(await listBlocks(params.id)))
  .post(
    "/:id/blocks",
    { admin: true, params: VehicleModel.BlockPost.Params, body: VehicleModel.BlockPost.Body, response: { 200: Envelope(VehicleModel.Block), ...staffErrors }, detail: { summary: "Block a vehicle for a period", description: "Refused with BOOKING_CONFLICT while a holding booking overlaps.", security: sessionSecurity } },
    async ({ params, body, user, request, server }) => {
      const block = await createBlock(params.id, body);
      await audit({ user, request, server }, "vehicle.block", { type: "vehicle", id: params.id, details: { blockId: block.id } });
      return ok(block);
    },
  )
  .delete(
    "/:id/blocks/:blockId",
    { admin: true, params: t.Object({ id: t.String({ format: "uuid" }), blockId: t.String({ format: "uuid" }) }), response: { 200: Envelope(t.Object({ id: t.String() })), ...staffErrors }, detail: { summary: "Remove a block", security: sessionSecurity } },
    async ({ params, user, request, server }) => {
      const removed = await deleteBlock(params.id, params.blockId);
      await audit({ user, request, server }, "vehicle.unblock", { type: "vehicle", id: params.id, details: { blockId: params.blockId } });
      return ok(removed);
    },
  );
