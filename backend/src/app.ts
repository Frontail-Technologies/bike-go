import { Elysia } from "elysia";
import { env } from "@/env";
import { accessLog } from "@/plugins/access-log";
import { authPlugin } from "@/plugins/auth";
import { corsPlugin } from "@/plugins/cors";
import { errorPlugin } from "@/plugins/error";
import { openapiPlugin } from "@/plugins/openapi";
import { requestMeta } from "@/plugins/request-meta";
import { securityHeaders } from "@/plugins/security";
import { adminRoutes } from "@/routes/admin";
import { availabilityRoutes } from "@/routes/availability";
import { addonRoutes, bookingRoutes } from "@/routes/booking";
import { health } from "@/routes/health";
import { documentRoutes } from "@/routes/document";
import { fxRoutes } from "@/routes/fx";
import { loanRoutes } from "@/routes/loan";
import { locationRoutes } from "@/routes/location";
import { paymentRoutes } from "@/routes/payment";
import { userRoutes } from "@/routes/user";
import { vehicleRoutes } from "@/routes/vehicle";

export const app = new Elysia({ name: "RideGo.App", serve: { maxRequestBodySize: env.MAX_REQUEST_BODY_BYTES } })
  .use(securityHeaders)
  .use(accessLog)
  .use(requestMeta)
  .use(errorPlugin)
  .use(corsPlugin)
  .use(openapiPlugin())
  .use(authPlugin)
  .use(health)
  .use(userRoutes)
  .use(locationRoutes)
  .use(vehicleRoutes)
  .use(availabilityRoutes)
  .use(fxRoutes)
  .use(addonRoutes)
  .use(bookingRoutes)
  .use(paymentRoutes)
  .use(loanRoutes)
  .use(documentRoutes)
  .use(adminRoutes);
