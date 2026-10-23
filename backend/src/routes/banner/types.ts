import type { UnwrapModels } from "elysia";
import type { BANNER_PLACEMENTS, BANNER_STATUSES, banners } from "@/libs/db/schema";
import type * as Model from "./model";

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];
export type BannerStatus = (typeof BANNER_STATUSES)[number];
export type BannerRow = typeof banners.$inferSelect;
export type BannersGet = UnwrapModels<typeof Model.BannersGet>;
