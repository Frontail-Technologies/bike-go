import { Elysia } from "elysia";
import { env } from "@/env";

const DOCS_PREFIX = "/api/v1/docs";

export const securityHeaders = new Elysia({ name: "RideGo.Security" }).onRequest(({ request, set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["referrer-policy"] = "no-referrer";
  set.headers["x-frame-options"] = "DENY";
  set.headers["cross-origin-resource-policy"] = "same-site";
  if (!new URL(request.url).pathname.startsWith(DOCS_PREFIX)) set.headers["content-security-policy"] = "default-src 'none'; frame-ancestors 'none'";
  if (env.NODE_ENV === "production") set.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
}).as("global");
