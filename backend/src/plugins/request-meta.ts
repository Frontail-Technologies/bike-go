import { Elysia } from "elysia";

const MAX_ID_LENGTH = 100;

/** The client's `x-request-id` when it is short and plain, otherwise a new UUID. */
function requestIdFrom(request: Request) {
  const supplied = request.headers.get("x-request-id");
  return supplied && supplied.length <= MAX_ID_LENGTH && /^[\w.:-]+$/.test(supplied) ? supplied : crypto.randomUUID();
}

/**
 * Gives every request an id and echoes it in the response headers for log correlation. The header is set in
 * `onRequest` (before routing), so even 404s, validation failures and auth errors carry it. Handlers get it as `requestId`.
 */
export const requestMeta = new Elysia({ name: "RideGo.RequestMeta" })
  .onRequest(({ request, set }) => {
    set.headers["x-request-id"] = requestIdFrom(request);
  })
  .derive(({ set }) => ({ requestId: String(set.headers["x-request-id"]) }))
  .as("global");
