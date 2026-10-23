import { Elysia } from "elysia";
import { audit } from "@/libs/audit";
import { ok, okPage, sessionSecurity, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as FxModel from "@/routes/fx/model";
import { createRate, listRates } from "@/routes/fx/service";

export const adminFxRoutes = new Elysia({ name: "RideGo.Admin.Fx", prefix: "/fx-rates", tags: ["Admin"] })
  .use(authPlugin)
  .get("", { admin: true, query: FxModel.FxListGet.Query, response: { 200: FxModel.FxListGet.Response, ...staffErrors }, detail: { summary: "Recorded exchange rates, newest effective first", security: sessionSecurity } }, async ({ query }) => okPage(await listRates(query)))
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
        security: sessionSecurity,
      },
    },
    async ({ body, user, request, server }) => {
      const created = await createRate(user.id, body);
      await audit({ user, request, server }, "fx.create", { type: "fx-rate", id: undefined, details: { base: body.baseCurrency, quote: body.quoteCurrency } });
      return ok(created);
    },
  );
