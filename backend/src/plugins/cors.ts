import { cors } from "@elysia/cors";
import { Elysia } from "elysia";
import { env } from "@/env";

export const corsPlugin = new Elysia({ name: "RideGo.Cors" }).use(
  cors({
    origin: env.FRONTEND_ORIGINS,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }),
);
