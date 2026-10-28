import { TabShell } from "@/components/customer/tab-shell";
import { getCustomerSessionServer } from "@/features/customer/auth/api/customer-session-server";
import { customerAuthKeys } from "@/features/customer/auth/query-keys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

// The session read below is request-time and can't be part of the static shell;
// opt this segment out of instant-navigation validation rather than blocking the build.
export const instant = false;

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(customerAuthKeys.session(), await getCustomerSessionServer());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TabShell>{children}</TabShell>
    </HydrationBoundary>
  );
}
