import { apiClient } from "@/lib/api/client";
import type { AdminSession } from "../types/session";

type Envelope<T> = { data: T };
export const adminAuthApi = {
  me: async () => (await apiClient.get<Envelope<AdminSession>>("/admin/me")).data.data,
  login: async (input: { email: string; password: string }) => (await apiClient.post<Envelope<AdminSession>>("/admin/auth/login", input)).data.data,
  logout: () => apiClient.post("/admin/auth/logout"),
  changePassword: async (input: { currentPassword: string; newPassword: string }) => (await apiClient.post<Envelope<AdminSession>>("/admin/auth/change-password", input)).data.data,
};
