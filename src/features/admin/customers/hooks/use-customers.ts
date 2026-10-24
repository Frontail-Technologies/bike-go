"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../api/customers-api";
import { adminCustomerQueryKeys } from "../query-keys";
import type { CustomerListParams, CustomerUpdateInput, PageParams } from "../types/customer";

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.list(params), queryFn: () => customersApi.list(params), placeholderData: keepPreviousData });
}

export function useCustomerQuery(id: string) {
  return useQuery({ queryKey: adminCustomerQueryKeys.detail(id), queryFn: () => customersApi.get(id) });
}

export function useCustomerBookingsQuery(id: string, page: PageParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.bookings(id, page), queryFn: () => customersApi.bookings(id, page), placeholderData: keepPreviousData });
}

export function useCustomerLoansQuery(id: string, page: PageParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.loans(id, page), queryFn: () => customersApi.loans(id, page), placeholderData: keepPreviousData });
}

export function useCustomerDocumentsQuery(id: string, page: PageParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.documents(id, page), queryFn: () => customersApi.documents(id, page), placeholderData: keepPreviousData });
}

export function useCustomerMutations() {
  const client = useQueryClient();
  return {
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string } & CustomerUpdateInput) => customersApi.update(id, input),
      onSuccess: (customer) => {
        client.setQueryData(adminCustomerQueryKeys.detail(customer.id), customer);
        void client.invalidateQueries({ queryKey: adminCustomerQueryKeys.root() });
      },
    }),
  };
}
