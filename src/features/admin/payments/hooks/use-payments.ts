"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments-api";
import { adminPaymentQueryKeys } from "../query-keys";
import type { PaymentListParams } from "../types/payment";

export function usePaymentsQuery(params: PaymentListParams) {
  return useQuery({ queryKey: adminPaymentQueryKeys.list(params), queryFn: () => paymentsApi.list(params), placeholderData: keepPreviousData });
}

export function usePaymentQuery(transactionId: string) {
  return useQuery({ queryKey: adminPaymentQueryKeys.detail(transactionId), queryFn: () => paymentsApi.get(transactionId) });
}
