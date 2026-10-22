import { openapi } from "@elysia/openapi";
import { auth } from "@/libs/auth";

const authSchema = await auth.api.generateOpenAPISchema();
const authPaths = Object.fromEntries(
  Object.entries(authSchema.paths).map(([path, operation]) => [`/api/v1/auth${path}`, Object.fromEntries(Object.entries(operation as Record<string, object>).map(([method, op]) => [method, { ...op, tags: ["Auth"] }]))]),
);

export const openapiPlugin = () =>
  openapi({
    path: "/api/v1/docs",
    specPath: "/api/v1/docs/json",
    documentation: {
      info: {
        title: "RideGo API",
        version: "0.1.0",
        description: [
          "Backend for RideGo vehicle rental and Expat Loan (Cambodia).",
          "",
          "**Responses.** Every success is `{ success: true, data, meta }`. Every failure is `{ success: false, error: { code, message, details }, requestId }` with a stable `code` (AUTH_REQUIRED, FORBIDDEN, VALIDATION_ERROR, NOT_FOUND, VEHICLE_UNAVAILABLE, BOOKING_CONFLICT, INVALID_BOOKING_STATUS, INVALID_LOAN_STATUS_TRANSITION, LOAN_NOT_EDITABLE, IDEMPOTENCY_CONFLICT, DOCUMENT_TYPE_INVALID, FILE_TOO_LARGE, INTERNAL_ERROR). Switch on the code, never the message. Every response carries an `x-request-id` header.",
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
