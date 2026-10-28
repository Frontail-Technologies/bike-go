import { StackShell } from "@/components/customer/stack-shell";
import { getCustomerSessionServer } from "@/features/customer/auth/api/customer-session-server";
import { customerAuthKeys } from "@/features/customer/auth/query-keys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

// The session read below is request-time and can't be part of the static shell;
// opt this segment out of instant-navigation validation rather than blocking the build.
export const instant = false;

export default async function StackLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const session = await getCustomerSessionServer();
  // Preserve the browser-side credentialed session check when the API cookie is
  // host-only on a sibling API subdomain and therefore unavailable to SSR.
  if (session) queryClient.setQueryData(customerAuthKeys.session(), session);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StackShell>{children}</StackShell>
    </HydrationBoundary>
  );
}
