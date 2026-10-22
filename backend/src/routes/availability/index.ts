import { Elysia } from "elysia";
import { ok, publicErrors } from "@/libs/api";
import * as AvailabilityModel from "./model";
import { getAvailability, resolveVehicleId } from "./service";

/** Same prefix and param name as the vehicle routes, so both plugins share `/vehicles/:idOrSlug`. */
export const availabilityRoutes = new Elysia({ name: "RideGo.Availability", prefix: "/api/v1/vehicles", tags: ["Vehicles"] }).get(
  "/:idOrSlug/availability",
  {
    params: AvailabilityModel.AvailabilityGet.Params,
    query: AvailabilityModel.AvailabilityGet.Query,
    response: { 200: AvailabilityModel.AvailabilityGet.Response, ...publicErrors },
    detail: {
      summary: "Is this vehicle free for a period?",
      description:
        "Checks confirmed, ready-for-pickup and active bookings plus maintenance blocks. Cancelled and completed bookings never block. This is advisory: the booking endpoint re-checks inside a transaction, and the database refuses overlapping holds.",
    },
  },
  async ({ params, query }) => ok(await getAvailability(await resolveVehicleId(params.idOrSlug), new Date(query.from), new Date(query.to))),
);
