import { Elysia } from "elysia";
import { corsPlugin } from "@/plugins/cors";
import { errorPlugin } from "@/plugins/error";
import { openapiPlugin } from "@/plugins/openapi";
import { requestMeta } from "@/plugins/request-meta";
import { health } from "@/routes/health";

/**
 * Composition root: global plugins, then feature plugins. It never listens, so tests import it directly
 * and `src/index.ts` is the only place that opens a port.
 */
export const app = new Elysia({ name: "RideGo.App" })
  .use(requestMeta)
  .use(errorPlugin)
  .use(corsPlugin)
  .use(openapiPlugin())
  .use(health);

export type App = typeof app;
