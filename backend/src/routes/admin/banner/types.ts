import type { UnwrapModels, UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type AdminBannersGet = UnwrapModels<typeof Model.BannersGet>;
export type BannerCreateInput = UnwrapSchema<typeof Model.BannerPost.Body>;
export type BannerPatchInput = UnwrapSchema<typeof Model.BannerPatch.Body>;
