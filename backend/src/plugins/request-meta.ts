import { Elysia } from "elysia";

const MAX_ID_LENGTH = 100;

/**
 * Gives every request an id (the client's `x-request-id` when it is sane, otherwise a new UUID), exposes
 * it to handlers as `requestId`, and echoes it in the response headers for log correlation.
 */
export const requestMeta = new Elysia({ name: "RideGo.RequestMeta" }).derive("global", ({ request, set }) => {
  const supplied = request.headers.get("x-request-id");
  const requestId = supplied && supplied.length <= MAX_ID_LENGTH && /^[\w.:-]+$/.test(supplied) ? supplied : crypto.randomUUID();
  set.headers["x-request-id"] = requestId;
  return { requestId };
});
