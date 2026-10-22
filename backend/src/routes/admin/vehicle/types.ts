import type { UnwrapModels } from "elysia";
import type * as Model from "./model";

export type VehiclePost = UnwrapModels<typeof Model.VehiclePost>;
export type VehiclePatch = UnwrapModels<typeof Model.VehiclePatch>;
export type VehiclesGet = UnwrapModels<typeof Model.VehiclesGet>;
export type BlockPost = UnwrapModels<typeof Model.BlockPost>;
