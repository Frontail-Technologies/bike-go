import { Elysia } from "elysia";

const MAX_ID_LENGTH = 100;

function requestIdFrom(request: Request) {
  const supplied = request.headers.get("x-request-id");
  return supplied &&
    supplied.length <= MAX_ID_LENGTH &&
    /^[\w.:-]+$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

export const requestMeta = new Elysia({ name: "RideGo.RequestMeta" })
  .onRequest(({ request, set }) => {
    set.headers["x-request-id"] = requestIdFrom(request);
  })
  .derive(({ set }) => ({ requestId: String(set.headers["x-request-id"]) }))
  .as("global");
