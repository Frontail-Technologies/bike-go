import { Elysia } from "elysia";
import { env } from "@/env";

const DOCS_PREFIX = "/api/v1/docs";

/**
 * Baseline response headers for an API that serves JSON and private files:
 * no MIME sniffing, no referrer leakage, no framing, same-site resource policy, and HSTS in production.
 * Set in `onRequest`, which runs before routing, so 404s and error responses carry them too.
 * The strict CSP skips the interactive docs page, which loads its own scripts and styles.
 */
export const securityHeaders = new Elysia({ name: "RideGo.Security" }).onRequest(({ request, set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["referrer-policy"] = "no-referrer";
  set.headers["x-frame-options"] = "DENY";
  set.headers["cross-origin-resource-policy"] = "same-site";
  if (!new URL(request.url).pathname.startsWith(DOCS_PREFIX)) set.headers["content-security-policy"] = "default-src 'none'; frame-ancestors 'none'";
  if (env.NODE_ENV === "production") set.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
}).as("global");
