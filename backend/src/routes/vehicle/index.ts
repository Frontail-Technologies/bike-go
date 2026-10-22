import { Elysia } from "elysia";
import { ok, publicErrors } from "@/libs/api";
import * as VehicleModel from "./model";
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
    async ({ query }) => {
      const { data, meta } = await listVehicles(query);
      return ok(data, meta);
    },
  )
  .get(
    "/:idOrSlug",
    {
      params: VehicleModel.VehicleByIdGet.Params,
      response: { 200: VehicleModel.VehicleByIdGet.Response, ...publicErrors },
      detail: { summary: "One vehicle by slug or id" },
    },
    async ({ params }) => ok(await getVehicle(params.idOrSlug)),
  );
