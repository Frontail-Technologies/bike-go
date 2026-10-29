import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { AdminSession } from "../types/session";

export const adminAuthApi = {
  me: async () => (await apiClient.get<Envelope<AdminSession>>("/admin/me")).data.data,
  login: async (input: { email: string; password: string }) => (await apiClient.post<Envelope<AdminSession>>("/admin/auth/login", input)).data.data,
  logout: () => apiClient.post("/admin/auth/logout"),
  changePassword: async (input: { currentPassword: string; newPassword: string }) => (await apiClient.post<Envelope<AdminSession>>("/admin/auth/change-password", input)).data.data,
};
