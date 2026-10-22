import { Elysia, NotFound, ParseError, ValidationError } from "elysia";
import { AppError, errorBody } from "@/libs/api";

const idOf = (set: { headers: Record<string, unknown> }) => String(set.headers["x-request-id"] ?? crypto.randomUUID());

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
