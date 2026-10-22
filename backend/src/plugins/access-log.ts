import { Elysia } from "elysia";
import { env } from "@/env";

const startedAt = new WeakMap<Request, number>();

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
