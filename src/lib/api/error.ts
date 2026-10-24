import { AxiosError, isAxiosError } from "axios";

export type ApiFieldError = { path?: string; message: string };

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | null;
  readonly fieldErrors: ApiFieldError[];

  constructor(options: { message: string; status?: number | null; code?: string; details?: unknown; requestId?: string | null; fieldErrors?: ApiFieldError[] }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status ?? null;
    this.code = options.code ?? "REQUEST_FAILED";
    this.details = options.details;
    this.requestId = options.requestId ?? null;
    this.fieldErrors = options.fieldErrors ?? fieldErrorsFromDetails(options.details);
  }
}

type ErrorEnvelope = {
  error?: { code?: string; message?: string; details?: unknown };
  message?: string;
  requestId?: string;
};

export function fieldErrorsFromDetails(details: unknown): ApiFieldError[] {
  if (!Array.isArray(details)) return [];
  return details.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as { path?: unknown; message?: unknown };
    return typeof value.message === "string" ? [{ path: typeof value.path === "string" ? value.path : undefined, message: value.message }] : [];
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError<ErrorEnvelope>(error)) {
    const response = error.response;
    const body = response?.data;
    return new ApiError({
      status: response?.status ?? null,
      code: body?.error?.code ?? (error.code === AxiosError.ERR_NETWORK ? "NETWORK_ERROR" : "REQUEST_FAILED"),
      message: body?.error?.message ?? body?.message ?? (error.code === AxiosError.ERR_NETWORK ? "Unable to reach RideGo. Check your connection and try again." : "The request could not be completed."),
      details: body?.error?.details,
      requestId: body?.requestId ?? response?.headers?.["x-request-id"] ?? null,
    });
  }
  return new ApiError({ message: error instanceof Error ? error.message : "The request could not be completed." });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
