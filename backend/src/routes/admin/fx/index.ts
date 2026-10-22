import { Elysia } from "elysia";
import { ok, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as FxModel from "@/routes/fx/model";
import { createRate, listRates } from "@/routes/fx/service";

const security = [{ sessionCookie: [] }];

export const adminFxRoutes = new Elysia({ name: "RideGo.Admin.Fx", prefix: "/fx-rates", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: FxModel.FxListGet.Query, response: { 200: FxModel.FxListGet.Response, ...staffErrors }, detail: { summary: "Recorded exchange rates, newest effective first", security } }, async ({ query }) => {
    const { data, meta } = await listRates(query);
    return ok(data, meta);
  })
  .post(
    "",
    {
      admin: true,
      body: FxModel.FxPost.Body,
      response: { 200: FxModel.FxPost.Response, ...staffErrors },
      detail: {
        summary: "Record an exchange rate",
        description:
          "Append-only. Each rate carries its source and the time it takes effect; the latest rate that has taken effect is the one in use. Rates are only used to derive loan limits for a currency without native limits.",
        security,
      },
    },
    async ({ body, user }) => ok(await createRate(user.id, body)),
  );
