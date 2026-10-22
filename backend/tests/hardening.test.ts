import { describe, expect, test } from "bun:test";
import { app } from "../src/app";
import { json } from "./helpers/http";
import { cookieFrom, postJson, request, signInCustomer, telegramPayload } from "./helpers/auth";

describe("response headers", () => {
  test("success, 404 and auth errors all carry the security headers", async () => {
    for (const response of [await request("/api/v1/health"), await request("/api/v1/nope"), await request("/api/v1/me")]) {
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-frame-options")).toBe("DENY");
      expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
      expect(response.headers.get("x-request-id")).toBeTruthy();
    }
  });

  test("the docs page is exempt from the strict CSP and HSTS is off outside production", async () => {
    const docs = await request("/api/v1/docs");
    expect(docs.status).toBe(200);
    expect(docs.headers.get("content-security-policy")).toBeNull();
    expect((await request("/api/v1/health")).headers.get("strict-transport-security")).toBeNull();
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    app.handle(new Request("http://localhost/api/v1/bookings", { method: "OPTIONS", headers: { origin, "access-control-request-method": "POST", "access-control-request-headers": "content-type,idempotency-key" } }));

  test("an allow-listed origin gets credentialed access", async () => {
    const response = await preflight("http://localhost:3000");
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("access-control-allow-headers")?.toLowerCase()).toContain("idempotency-key");
  });

  test("any other origin is not echoed back", async () => {
    for (const origin of ["https://evil.example", "http://localhost:3001", "null"]) {
      const response = await preflight(origin);
      expect(response.headers.get("access-control-allow-origin")).not.toBe(origin);
      expect(response.headers.get("access-control-allow-origin")).not.toBe("*");
    }
  });
});

describe("sessions", () => {
  test("the session cookie is HttpOnly and SameSite, and has a long, opaque value", async () => {
    const response = await postJson("/api/v1/auth/telegram/login", telegramPayload());
    const header = response.headers.getSetCookie().find((c) => c.startsWith("better-auth.session_token="))!;
    expect(header).toBeDefined();
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/SameSite=(Lax|Strict)/i);
    expect(header).toMatch(/Path=\//i);
    expect(header.split("=")[1]!.split(";")[0]!.length).toBeGreaterThan(40);
    expect(cookieFrom(response)).toContain("better-auth.session_token=");
  });

  test("signing out ends the session", async () => {
    const { cookie } = await signInCustomer();
    expect((await request("/api/v1/me", { cookie })).status).toBe(200);
    const out = await postJson("/api/v1/auth/sign-out", {}, { cookie });
    expect(out.status).toBe(200);
    // The old cookie value no longer authenticates.
    expect((await request("/api/v1/me", { cookie })).status).toBe(401);
  });
});

describe("error shape", () => {
  test("a malformed JSON body is a 4xx in the error envelope, not a 500", async () => {
    const { cookie } = await signInCustomer();
    const response = await request("/api/v1/bookings", { cookie, method: "POST", body: "{not json", headers: { "content-type": "application/json" } });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(await json(response)).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
  });

  test("validation details list the failing fields", async () => {
    const response = await postJson("/api/v1/bookings/quote", { vehicle: 5 });
    expect(response.status).toBe(422);
    const body = await json(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(body.error.details.length).toBeGreaterThan(0);
    expect(typeof body.requestId).toBe("string");
  });
});

describe("OpenAPI document", () => {
  const load = async () => json(await request("/api/v1/docs/json"));

  test("covers every public, customer and admin route", async () => {
    const doc = await load();
    const paths = Object.keys(doc.paths);
    for (const expected of [
      "/api/v1/health",
      "/api/v1/me",
      "/api/v1/locations",
      "/api/v1/vehicles",
      "/api/v1/vehicles/{idOrSlug}",
      "/api/v1/vehicles/{idOrSlug}/availability",
      "/api/v1/addons",
      "/api/v1/bookings",
      "/api/v1/bookings/quote",
      "/api/v1/bookings/{reference}",
      "/api/v1/bookings/{reference}/cancel",
      "/api/v1/loans",
      "/api/v1/loans/{reference}",
      "/api/v1/loans/{reference}/submit",
      "/api/v1/loans/{reference}/resubmit",
      "/api/v1/loans/{reference}/documents",
      "/api/v1/loans/{reference}/documents/{documentId}/file",
      "/api/v1/admin/dashboard",
      "/api/v1/admin/vehicles",
      "/api/v1/admin/vehicles/{id}/blocks",
      "/api/v1/admin/locations",
      "/api/v1/admin/bookings",
      "/api/v1/admin/bookings/{reference}/status",
      "/api/v1/admin/customers",
      "/api/v1/admin/loans",
      "/api/v1/admin/loans/{reference}/status",
      "/api/v1/admin/loans/{reference}/documents/{documentId}/review",
    ]) {
      expect({ path: expected, present: paths.includes(expected) }).toEqual({ path: expected, present: true });
    }
  });

  test("documents the auth endpoints, including Telegram, and hides the catch-all", async () => {
    const paths = Object.keys((await load()).paths);
    expect(paths).toContain("/api/v1/auth/telegram/login");
    expect(paths).toContain("/api/v1/auth/sign-in/social");
    expect(paths).toContain("/api/v1/auth/sign-out");
    expect(paths.some((p) => p.includes("*"))).toBe(false);
  });

  test("documents errors, security, pagination, idempotency and the status enums", async () => {
    const doc = await load();
    const me = doc.paths["/api/v1/me"].get;
    expect(Object.keys(me.responses)).toEqual(expect.arrayContaining(["200", "401"]));
    expect(me.security).toEqual([{ sessionCookie: [] }]);
    expect(doc.components.securitySchemes.sessionCookie).toBeDefined();

    const adminList = doc.paths["/api/v1/admin/bookings"].get;
    expect(Object.keys(adminList.responses)).toEqual(expect.arrayContaining(["200", "401", "403"]));
    const paramNames = adminList.parameters.map((p: { name: string }) => p.name);
    expect(paramNames).toEqual(expect.arrayContaining(["page", "pageSize", "status", "q", "sort"]));

    const description: string = doc.info.description;
    for (const word of ["Idempotency-Key", "BOOKING_CONFLICT", "USD", "KHR", "additional_documents_required", "totalPages"]) expect(description).toContain(word);

    const create = doc.paths["/api/v1/bookings"].post;
    expect(JSON.stringify(create.parameters)).toContain("idempotency-key");
    expect(JSON.stringify(doc.paths["/api/v1/admin/loans/{reference}/status"].patch)).toContain("eligibility_review");
  });

  test("the document upload is described as multipart", async () => {
    const upload = (await load()).paths["/api/v1/loans/{reference}/documents"].post;
    expect(Object.keys(upload.requestBody.content)).toContain("multipart/form-data");
  });
});
