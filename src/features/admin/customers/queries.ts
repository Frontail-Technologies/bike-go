import { queryOptions } from "@tanstack/react-query";
import { customersApi } from "./api/customers-api";
import { adminCustomerQueryKeys } from "./query-keys";

export const customerDetailQuery = (id: string) =>
  queryOptions({ queryKey: adminCustomerQueryKeys.detail(id), queryFn: () => customersApi.get(id) });
