import { apiClient } from "@/lib/api/client";
import type { ApiEnvelope as Envelope } from "@/lib/api/contracts";
import type { Banner, BannerCreateInput, BannerListMeta, BannerListParams, BannerPlacement, BannerUpdateInput } from "../types/banner";

const data = <T>(response: { data: Envelope<T> }) => response.data.data;

function toFormData(input: BannerCreateInput | BannerUpdateInput) {
  const body = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    body.append(key, value instanceof File ? value : String(value));
  }
  return body;
}

export const bannersApi = {
  list: async (params: BannerListParams) => {
    const response = await apiClient.get<Envelope<Banner[]>>("/admin/banners", { params });
    return { data: response.data.data, meta: response.data.meta as BannerListMeta };
  },
  get: (id: string) => apiClient.get<Envelope<Banner>>(`/admin/banners/${id}`).then(data),
  create: (input: BannerCreateInput) => apiClient.post<Envelope<Banner>>("/admin/banners", toFormData(input)).then(data),
  update: (id: string, input: BannerUpdateInput) => apiClient.patch<Envelope<Banner>>(`/admin/banners/${id}`, toFormData(input)).then(data),
  remove: (id: string) => apiClient.delete(`/admin/banners/${id}`).then(() => undefined),
  reorder: (placement: BannerPlacement, ids: string[]) => apiClient.put<Envelope<Banner[]>>("/admin/banners/order", { placement, ids }).then(data),
  duplicate: (banner: Banner) => apiClient.post<Envelope<Banner>>(`/admin/banners/${banner.id}/duplicate`).then(data),
};
