"use client";

import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { adminT } from "@/features/admin/i18n/translate";
import { loanStatusLabels } from "../lib/loan-model";
import type { Loan, LoanStatusInput } from "../types/loan";
import { useLoanMutations } from "./use-loans";

export const loanActionError = (error: unknown) => (error instanceof ApiError ? error.message : adminT("common.genericError"));

export function useLoanActions() {
  const mutations = useLoanMutations();
  return {
    changeStatus: async (loan: Pick<Loan, "reference">, input: LoanStatusInput) => {
      const updated = await mutations.updateStatus.mutateAsync({ reference: loan.reference, ...input });
      toast.success(adminT("loans.updated"), { description: adminT("loans.nowStatus", { reference: loan.reference, status: loanStatusLabels[updated.status] }) });
      return updated;
    },
  };
}
