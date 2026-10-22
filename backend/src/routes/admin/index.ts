import { Elysia, t } from "elysia";
import { Envelope, ok } from "@/libs/api";
import { authPlugin } from "@/plugins/auth";
import { adminBookingRoutes } from "./booking";
import { adminCustomerRoutes } from "./customer";
import { adminDashboardRoutes } from "./dashboard";
import { adminLoanRoutes } from "./loan";
import { adminLocationRoutes } from "./location";
import { adminVehicleRoutes } from "./vehicle";

/**
 * Staff-only API under /api/v1/admin. Every route sets `admin: true`, so a missing session is 401 and a
 * customer is 403. Feature areas are child plugins mounted here.
 */
export const adminRoutes = new Elysia({ name: "RideGo.Admin", prefix: "/api/v1/admin", tags: ["Admin"] })
  .use(authPlugin)
  .get(
    "/me",
    {
      admin: true,
      response: { 200: Envelope(t.Object({ id: t.String(), role: t.UnionEnum(["admin", "super_admin"]) })) },
      detail: { summary: "The signed-in staff member", security: [{ sessionCookie: [] }] },
    },
    ({ user }) => ok({ id: user.id, role: user.role as "admin" | "super_admin" }),
  )
  .use(adminVehicleRoutes)
  .use(adminLocationRoutes)
  .use(adminDashboardRoutes)
  .use(adminBookingRoutes)
  .use(adminCustomerRoutes)
  .use(adminLoanRoutes);
