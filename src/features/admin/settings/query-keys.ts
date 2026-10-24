import type { MasterKind, MasterPageParams } from "./types/master-data";
export const masterDataQueryKeys={all:["admin","master-data"] as const,list:(kind:MasterKind,params:MasterPageParams)=>[...masterDataQueryKeys.all,kind,params] as const};
