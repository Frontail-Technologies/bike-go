import { TabShell } from "@/components/customer/tab-shell";
import { getCustomerSessionServer } from "@/features/customer/auth/api/customer-session-server";
import { customerAuthKeys } from "@/features/customer/auth/query-keys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export const instant = false;

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const session = await getCustomerSessionServer();
  if (session) queryClient.setQueryData(customerAuthKeys.session(), session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TabShell>{children}</TabShell>
    </HydrationBoundary>
  );
}
