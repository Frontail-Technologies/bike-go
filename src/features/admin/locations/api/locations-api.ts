import { apiClient } from "@/lib/api/client";
import type { Location, LocationInput } from "../types/location";

type Envelope<T> = { data: T };
const data = <T>(response: { data: Envelope<T> }) => response.data.data;

export const locationsApi = {
  list: () => apiClient.get<Envelope<Location[]>>("/admin/locations").then(data),
  create: (input: LocationInput) => apiClient.post<Envelope<Location>>("/admin/locations", input).then(data),
  update: (id: string, input: Partial<LocationInput>) => apiClient.patch<Envelope<Location>>(`/admin/locations/${id}`, input).then(data),
};
