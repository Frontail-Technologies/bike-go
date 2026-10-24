import { apiClient } from "@/lib/api/client";
import type { AdminUser, AdminUsersMeta, AdminUsersParams } from "../types/admin-user";
type Envelope<T> = { data: T; meta: Record<string, unknown> };
const data = <T>(response: { data: Envelope<T> }) => response.data.data;
export const adminUsersApi = {
  list: async (params: AdminUsersParams) => { const response = await apiClient.get<Envelope<AdminUser[]>>("/admin/admins", { params }); return { data: response.data.data, meta: response.data.meta as AdminUsersMeta }; },
  get: (id: string) => apiClient.get<Envelope<AdminUser>>(`/admin/admins/${id}`).then(data),
  create: (input: { name: string; email: string; role: "admin" | "super_admin"; password: string }) => apiClient.post<Envelope<AdminUser>>("/admin/admins", input).then(data),
  update: (id: string, input: { name: string; role: "admin" | "super_admin" }) => apiClient.patch<Envelope<AdminUser>>(`/admin/admins/${id}`, input).then(data),
  activate: (id: string) => apiClient.post<Envelope<AdminUser>>(`/admin/admins/${id}/activate`).then(data),
  deactivate: (id: string) => apiClient.post<Envelope<AdminUser>>(`/admin/admins/${id}/deactivate`).then(data),
  resetPassword: (id: string, password: string) => apiClient.post<Envelope<AdminUser>>(`/admin/admins/${id}/reset-password`, { password }).then(data),
};
