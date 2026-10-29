import { queryOptions } from "@tanstack/react-query";
import { bannersApi } from "./api/banners-api";
import { adminBannerQueryKeys } from "./query-keys";
import type { BannerListParams } from "./types/banner";

export const bannerListQuery = (params: BannerListParams) =>
  queryOptions({ queryKey: adminBannerQueryKeys.list(params), queryFn: () => bannersApi.list(params) });
