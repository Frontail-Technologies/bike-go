import { Elysia, t } from "elysia";
import { Envelope, ok, staffErrors } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import { adminBookingRoutes } from "./booking";
import { adminCustomerRoutes } from "./customer";
import { adminDashboardRoutes } from "./dashboard";
import { adminFxRoutes } from "./fx";
import { adminLoanRoutes } from "./loan";
import { adminLocationRoutes } from "./location";
import { adminVehicleRoutes } from "./vehicle";

export const adminRoutes = new Elysia({ name: "RideGo.Admin", prefix: "/api/v1/admin", tags: ["Admin"] })
  .use(authPlugin)
  .get(
    "/me",
    {
      admin: true,
      response: { 200: Envelope(t.Object({ id: t.String(), role: t.UnionEnum(["admin", "super_admin"]) })), ...staffErrors },
      detail: { summary: "The signed-in staff member", security: [{ sessionCookie: [] }] },
    },
    ({ user }) => ok({ id: user.id, role: user.role as "admin" | "super_admin" }),
  )
  .use(adminVehicleRoutes)
  .use(adminLocationRoutes)
  .use(adminDashboardRoutes)
  .use(adminBookingRoutes)
  .use(adminCustomerRoutes)
  .use(adminFxRoutes)
  .use(adminLoanRoutes);
