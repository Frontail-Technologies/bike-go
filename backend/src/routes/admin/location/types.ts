import type { UnwrapSchema } from "elysia";
import type * as Model from "./model";

export type LocationCreateInput = UnwrapSchema<typeof Model.LocationPost.Body>;
export type LocationPatchInput = UnwrapSchema<typeof Model.LocationPatch.Body>;
