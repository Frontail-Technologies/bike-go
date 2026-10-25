import { apiClient } from "@/lib/api/client";
import type { MasterInput, MasterItem, MasterKind, MasterPageMeta, MasterPageParams } from "../types/master-data";

type Envelope<T> = { data: T; meta: Record<string, unknown> };

export const masterDataApi = {
  list: async (kind: MasterKind, params: MasterPageParams) => {
    const result = await apiClient.get<Envelope<MasterItem[]>>(`/admin/master-data/${kind}/page`, { params });
    return { data: result.data.data, meta: result.data.meta as MasterPageMeta };
  },
  create: (kind: MasterKind, input: MasterInput) => apiClient.post<Envelope<MasterItem>>(`/admin/master-data/${kind}`, input).then((response) => response.data.data),
  update: (kind: MasterKind, id: string, input: Partial<MasterInput>) => apiClient.patch<Envelope<MasterItem>>(`/admin/master-data/${kind}/${id}`, input).then((response) => response.data.data),
  reorder: (kind: MasterKind, ids: string[]) => apiClient.put<Envelope<MasterItem[]>>(`/admin/master-data/${kind}/order`, { ids }).then((response) => response.data.data),
  setImage: (kind: MasterKind, id: string, image: File) => {
    const body = new FormData();
    body.append("image", image);
    return apiClient.put<Envelope<MasterItem>>(`/admin/master-data/${kind}/${id}/image`, body).then((response) => response.data.data);
  },
  removeImage: (kind: MasterKind, id: string) => apiClient.delete<Envelope<MasterItem>>(`/admin/master-data/${kind}/${id}/image`).then((response) => response.data.data),
  remove: (kind: MasterKind, id: string) => apiClient.delete<Envelope<{ id: string }>>(`/admin/master-data/${kind}/${id}`).then((response) => response.data.data),
};
