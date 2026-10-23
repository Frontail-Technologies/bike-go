import { Elysia } from "elysia";
import { env } from "@/env";
import { AppError } from "@/libs/api";
import { uploadRouteFor } from "@/libs/upload-routes";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PAYWAY_CALLBACK = "/api/v1/payments/payway/callback";

const allowedOrigins = new Set([...env.FRONTEND_ORIGINS, new URL(env.BETTER_AUTH_URL).origin]);

const originOf = (value: string | null) => {
  if (!value || value === "null") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

function assertSameSite(request: Request, path: string) {
  if (path === PAYWAY_CALLBACK || !request.headers.get("cookie")) return;
  const origin = request.headers.get("origin");
  const source = origin !== null ? originOf(origin) : originOf(request.headers.get("referer"));
  if (!source || !allowedOrigins.has(source)) throw new AppError("FORBIDDEN", 403, "This request did not come from RideGo.");
}

function assertBodySize(request: Request, path: string) {
  const upload = uploadRouteFor(request.method, path);
  if (upload && !request.headers.get("cookie")) throw new AppError("AUTH_REQUIRED", 401, "Sign in to continue.");

  const limit = upload?.maxBytes ?? env.JSON_BODY_LIMIT_BYTES;
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0 || length > limit) {
      throw new AppError("REQUEST_TOO_LARGE", 413, `This request is larger than the ${Math.floor(limit / 1024)} KB this endpoint accepts.`);
    }
    return;
  }
  if (!upload && request.headers.get("transfer-encoding")) throw new AppError("REQUEST_TOO_LARGE", 413, "Send a Content-Length with this request.");
}

export const requestGuards = new Elysia({ name: "RideGo.RequestGuards" })
  .onRequest(({ request }) => {
    if (!UNSAFE.has(request.method)) return;
    const path = new URL(request.url).pathname;
    assertSameSite(request, path);
    assertBodySize(request, path);
  })
  .as("global");
