import { apiClient } from "@/lib/api/client";
import type { Addon, AddonCreateInput, AddonUpdateInput } from "../types/addon";

type Envelope<T> = { data: T };

export const addonsApi = {
  list: () => apiClient.get<Envelope<Addon[]>>("/admin/addons").then((response) => response.data.data),
  create: (input: AddonCreateInput) => apiClient.post<Envelope<Addon>>("/admin/addons", input).then((response) => response.data.data),
  update: (id: string, input: AddonUpdateInput) => apiClient.patch<Envelope<Addon>>(`/admin/addons/${id}`, input).then((response) => response.data.data),
};
