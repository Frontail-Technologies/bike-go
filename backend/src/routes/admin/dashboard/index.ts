import { Elysia } from "elysia";
import { ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import * as DashboardModel from "./model";
import { getDashboard } from "./service";

export const adminDashboardRoutes = new Elysia({ name: "RideGo.Admin.Dashboard", prefix: "/dashboard", tags: ["Admin"] })
  .use(authPlugin)
  .get(
    "",
    {
      admin: true,
      response: { 200: DashboardModel.DashboardGet.Response },
      detail: { summary: "Dashboard numbers", description: "Counts by status, upcoming pickups, per-currency revenue (never mixed across currencies), loans awaiting review and recent activity.", security: [{ sessionCookie: [] }] },
    },
    async () => ok(await getDashboard()),
  );
