import type { BannerListParams } from "./types/banner";

/** Query identities local to the banners feature. */
export const adminBannerQueryKeys = {
  root: () => ["admin", "banners"] as const,
  list: (params: BannerListParams) => ["admin", "banners", "list", params] as const,
  detail: (id: string) => ["admin", "banners", "detail", id] as const,
} as const;
