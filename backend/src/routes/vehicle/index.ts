import { Elysia } from "elysia";
import { ok, okPage, publicErrors } from "@/libs/api";
import * as VehicleModel from "./model";
import { vehicleImageFile } from "./images";
import { getVehicle, listVehicles } from "./service";

export const vehicleRoutes = new Elysia({ name: "RideGo.Vehicle", prefix: "/api/v1/vehicles", tags: ["Vehicles"] })
  .get(
    "",
    {
      query: VehicleModel.VehiclesGet.Query,
      response: { 200: VehicleModel.VehiclesGet.Response, ...publicErrors },
      detail: {
        summary: "Search the vehicle catalogue",
        description:
          "Filter by location, type, category, brand, transmission, daily price and engine size (prices in minor units). Send `pickupAt` and `returnAt` together to keep only vehicles free for the whole period.",
      },
    },
    async ({ query }) => okPage(await listVehicles(query)),
  )
  .get("/images/:imageId", { params: VehicleModel.VehicleImageGet.Params, detail: { summary: "One uploaded vehicle image", description: "Public and cacheable for a few minutes." } }, async ({ params }) => vehicleImageFile(params.imageId))
  .get(
    "/:idOrSlug",
    {
      params: VehicleModel.VehicleByIdGet.Params,
      response: { 200: VehicleModel.VehicleByIdGet.Response, ...publicErrors },
      detail: { summary: "One vehicle by slug or id" },
    },
    async ({ params }) => ok(await getVehicle(params.idOrSlug)),
  );
