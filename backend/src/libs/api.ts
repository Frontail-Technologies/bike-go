import { t } from "elysia";

/** Stable machine-readable error codes. Clients switch on these, never on messages. */
export const ERROR_CODES = [
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "VEHICLE_UNAVAILABLE",
  "BOOKING_CONFLICT",
  "INVALID_BOOKING_STATUS",
  "INVALID_LOAN_STATUS_TRANSITION",
  "LOAN_NOT_EDITABLE",
  "IDEMPOTENCY_CONFLICT",
  "DOCUMENT_TYPE_INVALID",
  "FILE_TOO_LARGE",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** An expected business failure. Services throw it; the error plugin turns it into the response envelope. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly httpStatus: number,
    message: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError("NOT_FOUND", 404, `${what} not found.`);
export const forbidden = (message = "You do not have access to this resource.") => new AppError("FORBIDDEN", 403, message);

/** Success envelope: `{ success: true, data, meta? }`. */
export function ok<T>(data: T, meta: Record<string, unknown> = {}) {
  return { success: true as const, data, meta };
}

export type ErrorBody = {
  success: false;
  error: { code: ErrorCode; message: string; details: unknown };
  requestId: string;
};

export function errorBody(code: ErrorCode, message: string, requestId: string, details: unknown = null): ErrorBody {
  return { success: false, error: { code, message, details }, requestId };
}

// ------------------------------------------------------------------ shared schemas

export const Meta = t.Object({}, { additionalProperties: true });

/** Wraps a data schema in the success envelope, for responses and OpenAPI. */
export const Envelope = <T extends ReturnType<typeof t.Object> | ReturnType<typeof t.Array> | ReturnType<typeof t.Null>>(data: T) =>
  t.Object({ success: t.Literal(true), data, meta: Meta });

export const ErrorEnvelope = t.Object({
  success: t.Literal(false),
  error: t.Object({
    code: t.UnionEnum([...ERROR_CODES]),
    message: t.String(),
    details: t.Unknown(),
  }),
  requestId: t.String(),
});

export const Currency = t.UnionEnum(["USD", "KHR"]);

export const PaginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

/**
 * Error responses for the OpenAPI document. Spread into a route's `response` map next to its success schema.
 * Thrown errors (AppError) are formatted by the error plugin; these entries document what a client can receive.
 */
export const publicErrors = { 404: ErrorEnvelope, 422: ErrorEnvelope } as const;
export const customerErrors = { 401: ErrorEnvelope, 404: ErrorEnvelope, 409: ErrorEnvelope, 422: ErrorEnvelope } as const;
export const staffErrors = { 401: ErrorEnvelope, 403: ErrorEnvelope, 404: ErrorEnvelope, 409: ErrorEnvelope, 422: ErrorEnvelope } as const;
