import { openapi } from "@elysia/openapi";

/**
 * Interactive docs at /api/v1/docs and the raw document at /api/v1/docs/json.
 * A factory, not a wrapper plugin: the OpenAPI plugin documents the routes of the instance it is mounted on,
 * so it has to be `.use()`d on the root app that owns every feature route.
 */
export const openapiPlugin = () =>
  openapi({
    path: "/api/v1/docs",
    specPath: "/api/v1/docs/json",
    documentation: {
      info: {
        title: "RideGo API",
        version: "0.1.0",
        description: [
          "Backend for RideGo vehicle rental and Expat Loan.",
          "",
          "- Every success is `{ success: true, data, meta }`; every failure is `{ success: false, error: { code, message, details }, requestId }`.",
          "- Money is always integer minor units with an explicit `currency` (USD or KHR).",
          "- Sessions are cookies set by `/api/v1/auth/*`. Admin routes need an `admin` or `super_admin` role.",
          "- `POST /bookings` and `POST /loans/{reference}/submit` accept an `Idempotency-Key` header.",
        ].join("\n"),
      },
      tags: [
        { name: "Health" },
        { name: "Auth" },
        { name: "Me" },
        { name: "Locations" },
        { name: "Vehicles" },
        { name: "Bookings" },
        { name: "Loans" },
        { name: "Loan documents" },
        { name: "Admin" },
      ],
      components: {
        securitySchemes: {
          sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
        },
      },
    },
  });
