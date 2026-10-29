"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminBookingQueryKeys } from "@/features/admin/bookings/query-keys";
import { adminCustomerQueryKeys } from "@/features/admin/customers/query-keys";
import { adminDashboardQueryKeys } from "@/features/admin/dashboard/query-keys";
import { paymentsApi } from "../api/payments-api";
import { adminPaymentQueryKeys } from "../query-keys";
import type { PaymentDetail, PaymentListParams, RefundInput } from "../types/payment";

export function usePaymentsQuery(params: PaymentListParams) {
  return useQuery({ queryKey: adminPaymentQueryKeys.list(params), queryFn: () => paymentsApi.list(params), placeholderData: keepPreviousData });
}

export function usePaymentMethodsQuery() {
  return useQuery({ queryKey: adminPaymentQueryKeys.methods(), queryFn: paymentsApi.methods, staleTime: 60_000 });
}

export function usePaymentQuery(transactionId: string) {
  return useQuery({ queryKey: adminPaymentQueryKeys.detail(transactionId), queryFn: () => paymentsApi.get(transactionId) });
}

export function usePaymentMutations(transactionId: string) {
  const client = useQueryClient();
  const settle = (payment: PaymentDetail) => {
    client.setQueryData(adminPaymentQueryKeys.detail(transactionId), payment);
    void client.invalidateQueries({ queryKey: adminPaymentQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminBookingQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminCustomerQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminDashboardQueryKeys.root() });
  };
  return {
    sync: useMutation({ mutationFn: () => paymentsApi.sync(transactionId), onSuccess: settle }),
    refund: useMutation({
      mutationFn: (input: RefundInput) => paymentsApi.refund(transactionId, input),
      onSuccess: (result) => settle(result.payment),
      onError: () => void client.invalidateQueries({ queryKey: adminPaymentQueryKeys.detail(transactionId) }),
    }),
  };
}
