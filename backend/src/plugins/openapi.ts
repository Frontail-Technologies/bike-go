import { openapi } from "@elysia/openapi";
import { Elysia } from "elysia";
import { auth } from "@/libs/auth";

const authSchema = await auth.api.generateOpenAPISchema();
const authPaths = Object.fromEntries(
  Object.entries(authSchema.paths).map(([path, operation]) => [`/api/v1/auth${path}`, Object.fromEntries(Object.entries(operation as Record<string, object>).map(([method, op]) => [method, { ...op, tags: ["Auth"] }]))]),
);

const SPEC_PATH = "/api/v1/docs/json";

const isBinary = (node: unknown) => Boolean(node) && typeof node === "object" && (node as Record<string, unknown>).format === "binary";

function describeFiles(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(describeFiles);
  if (!node || typeof node !== "object") return;
  const schema = node as Record<string, unknown>;
  if (schema["~kind"] === "File") {
    delete schema["~kind"];
    delete schema["~elyTyp"];
    schema.type = "string";
    schema.format = "binary";
    return;
  }
  Object.values(schema).forEach(describeFiles);
  const options = schema.anyOf;
  if (Array.isArray(options) && options.length === 2) {
    const list = options.find((option) => option?.type === "array" && isBinary(option.items));
    const single = options.find((option) => isBinary(option));
    if (list && single) {
      delete schema.anyOf;
      delete schema["~elyTyp"];
      schema.type = "array";
      schema.items = { type: "string", format: "binary" };
    }
  }
}

export const openapiFiles = new Elysia({ name: "RideGo.OpenApi.Files" }).onAfterHandle(({ path, responseValue }) => {
  if (path !== SPEC_PATH || !responseValue || typeof responseValue !== "object") return;
  describeFiles(responseValue);
  return responseValue;
}).as("global");

export const openapiPlugin = () =>
  openapi({
    path: "/api/v1/docs",
    specPath: SPEC_PATH,
    documentation: {
      info: {
        title: "RideGo API",
        version: "0.1.0",
        description: [
          "Backend for RideGo vehicle rental and Expat Loan (Cambodia).",
          "",
          "**Responses.** Every success is `{ success: true, data, meta }`. Every failure is `{ success: false, error: { code, message, details }, requestId }` with a stable `code` (AUTH_REQUIRED, FORBIDDEN, VALIDATION_ERROR, NOT_FOUND, VEHICLE_UNAVAILABLE, BOOKING_CONFLICT, INVALID_BOOKING_STATUS, INVALID_LOAN_STATUS_TRANSITION, LOAN_NOT_EDITABLE, IDEMPOTENCY_CONFLICT, DOCUMENT_TYPE_INVALID, FILE_TOO_LARGE, FILE_TYPE_INVALID, RATE_LIMITED, REQUEST_TOO_LARGE, PAYMENT_UNAVAILABLE, PAYMENT_PROVIDER_ERROR, INTERNAL_ERROR). Switch on the code, never the message. Every response carries an `x-request-id` header.",
          "",
          "**Money.** Always integer minor units (cents for USD, sen for KHR) next to an explicit `currency` of `USD` or `KHR`. Totals are computed by the server; any total a client sends is ignored.",
          "",
          "**Auth.** Sign in with Google (`/auth/sign-in/social`) or Telegram (`/auth/telegram/login`); the session is an HTTP-only cookie. Browsers must send credentials. Roles are `customer`, `admin` and `super_admin`, assigned only in the database. `/admin/*` needs `admin` or `super_admin`.",
          "",
          "**Pagination.** List endpoints take `page` (from 1) and `pageSize` (1 to 100, default 20) and return `meta: { page, pageSize, total, totalPages }`.",
          "",
          "**Idempotency.** `POST /bookings` and `POST /loans/{reference}/submit` accept an `Idempotency-Key` header (8 to 128 characters). Retrying with the same key and the same request returns the original result (with `Idempotent-Replayed: true`); the same key with a different request is `409 IDEMPOTENCY_CONFLICT`. Keys are scoped to the signed-in user and kept for 24 hours; failed attempts are not stored.",
          "",
          "**Statuses.** Booking: pending, confirmed, ready_for_pickup, active, completed, cancelled. Payment: unpaid, pending, paid, failed, refunded, partially_refunded. Loan: draft, submitted, documents_under_review, additional_documents_required, eligibility_review, approved, rejected. Document verification: uploaded, verified, needs_review, rejected.",
        ].join("\n"),
      },
      tags: [
        { name: "Health", description: "Liveness" },
        { name: "Auth", description: "Google and Telegram sign-in, session and sign-out (Better Auth)" },
        { name: "Me", description: "The signed-in customer's profile" },
        { name: "Locations", description: "Pickup and return locations" },
        { name: "Vehicles", description: "Catalogue and availability" },
        { name: "Bookings", description: "Quotes, bookings and add-ons" },
        { name: "Loans", description: "Expat Loan applications" },
        { name: "Loan documents", description: "Private document uploads and downloads" },
        { name: "Admin", description: "Staff-only management APIs" },
      ],
      paths: authPaths as never,
      components: {
        schemas: authSchema.components?.schemas as never,
        securitySchemes: {
          sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token", description: "Set by a successful sign-in" },
        },
      },
    },
  });
