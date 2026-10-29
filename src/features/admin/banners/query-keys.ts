import type { BannerListParams } from "./types/banner";

export const adminBannerQueryKeys = {
  root: () => ["admin", "banners"] as const,
  list: (params: BannerListParams) => ["admin", "banners", "list", params] as const,
  detail: (id: string) => ["admin", "banners", "detail", id] as const,
} as const;
