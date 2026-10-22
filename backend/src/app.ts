import { Elysia } from "elysia";
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
import { loanRoutes } from "@/routes/loan";
import { locationRoutes } from "@/routes/location";
import { userRoutes } from "@/routes/user";
import { vehicleRoutes } from "@/routes/vehicle";

/**
 * Composition root: global plugins, then feature plugins. It never listens, so tests import it directly
 * and `src/index.ts` is the only place that opens a port.
 */
/** 5 MB documents plus multipart overhead. Larger bodies are refused by the server before any route runs. */
const MAX_BODY_BYTES = 8 * 1024 * 1024;

export const app = new Elysia({ name: "RideGo.App", serve: { maxRequestBodySize: MAX_BODY_BYTES } })
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
  .use(addonRoutes)
  .use(bookingRoutes)
  .use(loanRoutes)
  .use(documentRoutes)
  .use(adminRoutes);

export type App = typeof app;
