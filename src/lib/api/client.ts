import axios, { isAxiosError } from "axios";
import { toApiError } from "@/lib/api/error";

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "");
export const CUSTOMER_SESSION_EXPIRED_EVENT = "ridego:customer-session-expired";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  paramsSerializer: { indexes: null },
  headers: { Accept: "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof window !== "undefined" && isAxiosError(error) && error.response?.status === 401) {
      const url = String(error.config?.url ?? "").replace(/^https?:\/\/[^/]+\/api\/v1/, "");
      const isAdminRequest = url === "/admin" || url.startsWith("/admin/");
      const isAuthRequest = url === "/auth" || url.startsWith("/auth/");
      if (!isAdminRequest && !isAuthRequest) window.dispatchEvent(new Event(CUSTOMER_SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(toApiError(error));
  },
);
