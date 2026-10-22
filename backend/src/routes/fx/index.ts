import { Elysia } from "elysia";
import { ok, publicErrors } from "@/libs/api";
import * as FxModel from "./model";
import { getCurrentRate } from "./service";

export const fxRoutes = new Elysia({ name: "RideGo.Fx", prefix: "/api/v1/fx-rates", tags: ["Vehicles"] }).get(
  "/current",
  {
    query: FxModel.FxCurrentGet.Query,
    response: { 200: FxModel.FxCurrentGet.Response, ...publicErrors },
    detail: {
      summary: "The exchange rate currently in effect, with its source and effective date",
      description:
        "Informational. Prices, deposits and fees are stored natively in USD or KHR and are never converted automatically; a rate is only used to derive loan limits for a currency that has no native limits.",
    },
  },
  async ({ query }) => ok(await getCurrentRate(query.base, query.quote)),
);
