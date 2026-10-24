"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "../api/customers-api";
import { adminCustomerQueryKeys } from "../query-keys";
import type { CustomerListParams, CustomerUpdateInput, DocumentReviewInput, PageParams } from "../types/customer";

export function useCustomersQuery(params: CustomerListParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.list(params), queryFn: () => customersApi.list(params), placeholderData: keepPreviousData });
}

export function useCustomerStatsQuery() {
  return useQuery({ queryKey: adminCustomerQueryKeys.stats(), queryFn: customersApi.stats, staleTime: 30_000 });
}

export function useCustomerQuery(id: string) {
  return useQuery({ queryKey: adminCustomerQueryKeys.detail(id), queryFn: () => customersApi.get(id) });
}

/** The list stays lightweight, so editing loads the full profile first. */
export function useCustomerLoader() {
  const client = useQueryClient();
  return (id: string) => client.fetchQuery({ queryKey: adminCustomerQueryKeys.detail(id), queryFn: () => customersApi.get(id), staleTime: 0 });
}

export function useCustomerActivityQuery(id: string, page: PageParams) {
  return useQuery({ queryKey: adminCustomerQueryKeys.activity(id, page), queryFn: () => customersApi.activity(id, page), placeholderData: keepPreviousData });
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
  const refresh = () => client.invalidateQueries({ queryKey: adminCustomerQueryKeys.root() });
  return {
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string } & CustomerUpdateInput) => customersApi.update(id, input),
      onSuccess: (customer) => {
        client.setQueryData(adminCustomerQueryKeys.detail(customer.id), customer);
        void refresh();
      },
    }),
    reviewDocument: useMutation({
      mutationFn: ({ loanReference, documentId, ...input }: { loanReference: string; documentId: string } & DocumentReviewInput) => customersApi.reviewDocument(loanReference, documentId, input),
      onSuccess: refresh,
    }),
  };
}
