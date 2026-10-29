import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { Vehicle, VehicleBlock, VehicleBlockInput, VehicleCreateInput, VehicleDeleteResult, VehicleListMeta, VehicleListParams, VehicleUpdateInput } from "../types/vehicle";

const data = <T>(response: { data: Envelope<T> }) => response.data.data;

function toFormData(input: VehicleCreateInput | VehicleUpdateInput) {
  const body = new FormData();
  const { images, removeImageIds, imageOrder, ...scalars } = input as VehicleUpdateInput;
  for (const [key, value] of Object.entries(scalars)) {
    if (value === undefined) continue;
    body.append(key, value === null ? "" : String(value));
  }
  if (removeImageIds?.length) body.append("removeImageIds", JSON.stringify(removeImageIds));
  if (imageOrder?.length) body.append("imageOrder", JSON.stringify(imageOrder));
  for (const file of images ?? []) body.append("images", file);
  return body;
}

export const vehiclesApi = {
  options: () => apiClient.get<Envelope<VehicleOptionsResponse>>("/admin/vehicles/options").then((response) => response.data.data),
  list: async (params: VehicleListParams) => {
    const response = await apiClient.get<Envelope<Vehicle[]>>("/admin/vehicles", { params });
    return { data: response.data.data, meta: response.data.meta as VehicleListMeta };
  },
  get: (id: string) => apiClient.get<Envelope<Vehicle>>(`/admin/vehicles/${id}`).then(data),
  create: (input: VehicleCreateInput) => apiClient.post<Envelope<Vehicle>>("/admin/vehicles", toFormData(input)).then(data),
  update: (id: string, input: VehicleUpdateInput) => apiClient.patch<Envelope<Vehicle>>(`/admin/vehicles/${id}`, toFormData(input)).then(data),
  remove: (id: string) => apiClient.delete<Envelope<VehicleDeleteResult>>(`/admin/vehicles/${id}`).then(data),
  blocks: (id: string) => apiClient.get<Envelope<VehicleBlock[]>>(`/admin/vehicles/${id}/blocks`).then(data),
  addBlock: (id: string, input: VehicleBlockInput) => apiClient.post<Envelope<VehicleBlock>>(`/admin/vehicles/${id}/blocks`, input).then(data),
  removeBlock: (id: string, blockId: string) => apiClient.delete(`/admin/vehicles/${id}/blocks/${blockId}`).then(() => undefined),
};
export type VehicleOption = { value: string; label: string; active: boolean };
export type VehicleOptionsResponse = { vehicleTypes: VehicleOption[]; categories: VehicleOption[]; brands: VehicleOption[]; transmissions: VehicleOption[]; fuelTypes: VehicleOption[] };
