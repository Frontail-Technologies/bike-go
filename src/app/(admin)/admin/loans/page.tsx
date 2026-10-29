import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { LoanList } from "@/features/admin/loans/components/loan-list";

export default function LoansPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.loanApplications" />}><LoanList /></Suspense>;
}
