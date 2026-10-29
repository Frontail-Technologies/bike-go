import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import { unwrapPage, type ApiPage } from "@/lib/api/contracts";
import type { Location, LocationInput } from "../types/location";

const data = <T>(response: { data: Envelope<T> }) => response.data.data;

export const locationsApi = {
  list: () => apiClient.get<Envelope<Location[]>>("/admin/locations").then(data),
  page: async (params: { page: number; pageSize: number; q?: string; active?: boolean }): Promise<ApiPage<Location>> => unwrapPage((await apiClient.get<Envelope<Location[]>>("/admin/locations/page", { params })).data),
  create: (input: LocationInput) => apiClient.post<Envelope<Location>>("/admin/locations", input).then(data),
  update: (id: string, input: Partial<LocationInput>) => apiClient.patch<Envelope<Location>>(`/admin/locations/${id}`, input).then(data),
};
