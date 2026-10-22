import { describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { json } from "./helpers/http";

describe("health", () => {
  test("GET /api/v1/health returns the success envelope", async () => {
    const response = await app.handle("/api/v1/health");
    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.service).toBe("ridego-api");
  });

  test("every response carries a request id, and a sane client id is echoed", async () => {
    const generated = await app.handle("/api/v1/health");
    expect(generated.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);

    const echoed = await app.handle(new Request("http://localhost/api/v1/health", { headers: { "x-request-id": "trace-123" } }));
    expect(echoed.headers.get("x-request-id")).toBe("trace-123");

    const rejected = await app.handle(new Request("http://localhost/api/v1/health", { headers: { "x-request-id": "bad id with spaces" } }));
    expect(rejected.headers.get("x-request-id")).not.toBe("bad id with spaces");
  });

  test("unknown routes use the error envelope with a stable code", async () => {
    const response = await app.handle("/api/v1/nope");
    expect(response.status).toBe(404);
    const body = await json(response);
    expect(body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
    expect(typeof body.requestId).toBe("string");
  });

  test("OpenAPI document loads and lists the health route", async () => {
    const response = await app.handle("/api/v1/docs/json");
    expect(response.status).toBe(200);
    const doc = await json(response);
    expect(doc.info.title).toBe("RideGo API");
    expect(doc.paths["/api/v1/health"]).toBeDefined();
  });
});
