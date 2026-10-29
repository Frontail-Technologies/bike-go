import { queryOptions } from "@tanstack/react-query";
import { masterDataApi } from "./api/master-data-api";
import { masterDataQueryKeys } from "./query-keys";
import type { MasterKind, MasterPageParams } from "./types/master-data";

export const masterDataListQuery = (kind: MasterKind, params: MasterPageParams) =>
  queryOptions({ queryKey: masterDataQueryKeys.list(kind, params), queryFn: () => masterDataApi.list(kind, params) });
