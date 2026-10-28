import { StackShell } from "@/components/customer/stack-shell";
import { getCustomerSessionServer } from "@/features/customer/auth/api/customer-session-server";
import { customerAuthKeys } from "@/features/customer/auth/query-keys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function StackLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(customerAuthKeys.session(), await getCustomerSessionServer());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StackShell>{children}</StackShell>
    </HydrationBoundary>
  );
}
