import { cors } from "@elysia/cors";
import { Elysia } from "elysia";
import { env } from "@/env";

/** Browser access for the web app. Credentials are on because sessions are cookies, so origins are an explicit allow-list. */
export const corsPlugin = new Elysia({ name: "RideGo.Cors" }).use(
  cors({
    origin: env.WEB_ORIGINS,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }),
);
