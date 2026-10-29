import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { CustomerList } from "@/features/admin/customers/components/customer-list";

export default function CustomersPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.customers" />}><CustomerList /></Suspense>;
}
