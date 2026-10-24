import type { MasterKind, MasterPageParams } from "./types/master-data";

export const masterDataQueryKeys = {
  all: ["admin", "master-data"] as const,
  list: (kind: MasterKind, params: MasterPageParams) => [...masterDataQueryKeys.all, kind, params] as const,
};

export const addonQueryKeys = {
  all: ["admin", "addons"] as const,
  list: () => [...addonQueryKeys.all, "list"] as const,
};

export const systemRulesQueryKeys = {
  all: ["admin", "system-rules"] as const,
};
