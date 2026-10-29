"use client";

import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/error";
import { loanStatusLabels } from "../lib/loan-model";
import type { Loan, LoanStatusInput } from "../types/loan";
import { useLoanMutations } from "./use-loans";

export const loanActionError = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

export function useLoanActions() {
  const mutations = useLoanMutations();
  return {
    changeStatus: async (loan: Pick<Loan, "reference">, input: LoanStatusInput) => {
      const updated = await mutations.updateStatus.mutateAsync({ reference: loan.reference, ...input });
      toast.success("Application updated", { description: `${loan.reference} is now ${loanStatusLabels[updated.status]}.` });
      return updated;
    },
  };
}
