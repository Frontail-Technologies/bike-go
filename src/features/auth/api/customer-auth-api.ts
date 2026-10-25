import { createAuthClient } from "better-auth/client";
import { apiClient, apiBaseUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/error";
import type { CustomerSession, TelegramLoginPayload } from "../types";

export const customerAuthClient = createAuthClient({ baseURL: `${apiBaseUrl}/auth` });

function authError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return new ApiError({ message: fallback });
  const value = error as { status?: number; statusCode?: number; code?: string; message?: string };
  return new ApiError({
    status: value.statusCode ?? value.status ?? null,
    code: value.code ?? "AUTH_FAILED",
    message: value.message ?? fallback,
  });
}

export const customerAuthApi = {
  async session(): Promise<CustomerSession | null> {
    const result = await customerAuthClient.getSession();
    if (result.error) {
      if (result.error.status === 401) return null;
      throw authError(result.error, "Unable to check your session.");
    }
    return (result.data as CustomerSession | null) ?? null;
  },

  async signInWithGoogle(callbackURL: string) {
    const result = await customerAuthClient.signIn.social({ provider: "google", callbackURL });
    if (result.error) throw authError(result.error, "Google sign-in could not be started.");
    return result.data;
  },

  async signInWithTelegram(payload: TelegramLoginPayload) {
    await apiClient.post("/auth/telegram/login", payload);
  },

  async signOut() {
    const result = await customerAuthClient.signOut();
    if (result.error) throw authError(result.error, "Sign out could not be completed.");
  },
};
