"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCustomerQueryKeys } from "@/features/admin/customers/query-keys";
import { adminDashboardQueryKeys } from "@/features/admin/dashboard/query-keys";
import { adminDocumentQueryKeys } from "@/features/admin/documents/query-keys";
import { loansApi } from "../api/loans-api";
import { adminLoanQueryKeys } from "../query-keys";
import type { Loan, LoanListParams, LoanStatusInput } from "../types/loan";

export function useLoansQuery(params: LoanListParams) {
  return useQuery({ queryKey: adminLoanQueryKeys.list(params), queryFn: () => loansApi.list(params), placeholderData: keepPreviousData });
}

export function useLoanStatsQuery() {
  return useQuery({ queryKey: adminLoanQueryKeys.stats(), queryFn: loansApi.stats, staleTime: 30_000 });
}

export function useLoanQuery(reference: string) {
  return useQuery({ queryKey: adminLoanQueryKeys.detail(reference), queryFn: () => loansApi.get(reference) });
}

/** A status change returns the fresh application, so the detail cache is replaced and everything derived refetches. */
export function useLoanMutations() {
  const client = useQueryClient();
  const settle = (loan: Loan) => {
    client.setQueryData(adminLoanQueryKeys.detail(loan.reference), loan);
    void client.invalidateQueries({ queryKey: adminLoanQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminDocumentQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminCustomerQueryKeys.root() });
    void client.invalidateQueries({ queryKey: adminDashboardQueryKeys.root() });
  };
  return {
    updateStatus: useMutation({ mutationFn: ({ reference, ...input }: { reference: string } & LoanStatusInput) => loansApi.updateStatus(reference, input), onSuccess: settle }),
  };
}
