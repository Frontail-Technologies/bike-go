import { apiClient } from "@/lib/api/client";
import type { Banner, BannerCreateInput, BannerListMeta, BannerListParams, BannerPlacement, BannerUpdateInput } from "../types/banner";

type Envelope<T> = { data: T; meta: Record<string, unknown> };
const data = <T>(response: { data: Envelope<T> }) => response.data.data;

/** Multipart body: the fields and the image travel in one request. Undefined values are skipped so PATCH sends only changes. */
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
  /** A copy starts inactive and re-uploads the original image, so the two never share a file. */
  duplicate: async (banner: Banner) => {
    const image = (await apiClient.get<Blob>(banner.imageUrl, { responseType: "blob" })).data;
    const file = new File([image], `${banner.id}.${image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg"}`, { type: image.type });
    return bannersApi.create({
      title: `${banner.title} (copy)`.slice(0, 120), subtitle: banner.subtitle ?? "", ctaLabel: banner.ctaLabel ?? "", ctaUrl: banner.ctaUrl ?? "", placement: banner.placement,
      displayOrder: banner.displayOrder, status: "inactive", startAt: banner.startAt ?? "", endAt: banner.endAt ?? "", image: file,
    });
  },
};
