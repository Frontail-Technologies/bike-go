import { Elysia } from "elysia";
import { env } from "@/env";

/** Per-request start times, keyed by the request object so concurrent requests cannot overwrite each other. */
const startedAt = new WeakMap<Request, number>();

/**
 * One JSON line per request: method, path, status, duration and the request id. Only the path is logged, never the
 * query string (OAuth callbacks carry codes there) and never headers, cookies or bodies, so no secret can reach the logs.
 */
export const accessLog = new Elysia({ name: "RideGo.AccessLog" })
  .onRequest(({ request }) => {
    startedAt.set(request, performance.now());
  })
  .onAfterResponse(({ request, set }) => {
    if (env.NODE_ENV === "test") return;
    const started = startedAt.get(request) ?? performance.now();
    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        method: request.method,
        path: new URL(request.url).pathname,
        status: typeof set.status === "number" ? set.status : 200,
        ms: Math.round(performance.now() - started),
        requestId: set.headers["x-request-id"],
      }),
    );
  })
  .as("global");
