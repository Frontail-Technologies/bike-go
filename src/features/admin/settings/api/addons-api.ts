import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import { unwrapPage, type ApiPage } from "@/lib/api/contracts";
import type { Addon, AddonCreateInput, AddonUpdateInput } from "../types/addon";


export const addonsApi = {
  list: () => apiClient.get<Envelope<Addon[]>>("/admin/addons").then((response) => response.data.data),
  page: async (params: { page: number; pageSize: number; q?: string; active?: boolean }): Promise<ApiPage<Addon>> => unwrapPage((await apiClient.get<Envelope<Addon[]>>("/admin/addons/page", { params })).data),
  create: (input: AddonCreateInput) => apiClient.post<Envelope<Addon>>("/admin/addons", input).then((response) => response.data.data),
  update: (id: string, input: AddonUpdateInput) => apiClient.patch<Envelope<Addon>>(`/admin/addons/${id}`, input).then((response) => response.data.data),
};
