import { Elysia, NotFound, ParseError, ValidationError } from "elysia";
import { AppError, errorBody } from "@/libs/api";

/** The id was put on the response headers by the request-meta plugin; fall back to a fresh one if it never ran. */
const idOf = (set: { headers: Record<string, unknown> }) => String(set.headers["x-request-id"] ?? crypto.randomUUID());

/**
 * One error shape for the whole API: `{ success: false, error: { code, message, details }, requestId }`.
 * Business failures throw AppError; Elysia's own validation, parse and routing errors are mapped to stable codes.
 */
export const errorPlugin = new Elysia({ name: "RideGo.Error" }).onError("global", ({ error, set }) => {
  const requestId = idOf(set);

  if (error instanceof AppError) {
    set.status = error.httpStatus;
    return errorBody(error.code, error.message, requestId, error.details);
  }
  if (error instanceof ValidationError) {
    set.status = 422;
    const details = error.all.map((issue) => ({ path: issue.path, message: issue.message }));
    return errorBody("VALIDATION_ERROR", "The request did not pass validation.", requestId, details);
  }
  if (error instanceof ParseError) {
    set.status = 400;
    return errorBody("VALIDATION_ERROR", "The request body could not be parsed.", requestId);
  }
  if (error instanceof NotFound) {
    set.status = 404;
    return errorBody("NOT_FOUND", "Route not found.", requestId);
  }

  console.error(`[${requestId}] unhandled error`, error);
  set.status = 500;
  return errorBody("INTERNAL_ERROR", "Something went wrong on our side.", requestId);
});
