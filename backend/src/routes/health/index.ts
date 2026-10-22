import { Elysia } from "elysia";
import { ok } from "@/libs/api";
import * as HealthModel from "./model";

export const health = new Elysia({ name: "RideGo.Health", prefix: "/api/v1/health", tags: ["Health"] }).get(
  "",
  {
    response: HealthModel.HealthGet.Response,
    detail: { summary: "Liveness check" },
  },
  () =>
    ok({
      status: "ok" as const,
      service: "ridego-api",
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    }),
);
