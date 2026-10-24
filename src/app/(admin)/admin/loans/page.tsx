import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { LoanList } from "@/features/admin/loans/components/loan-list";

export default function LoansPage() {
  return <Suspense fallback={<AdminLoadingState label="Loading loan applications…" />}><LoanList /></Suspense>;
}
