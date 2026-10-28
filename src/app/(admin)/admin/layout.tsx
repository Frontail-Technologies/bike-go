import { AdminQueryProvider } from "@/components/admin/providers/admin-query-provider";
import { BrandLoader } from "@/components/customer/brand-loader";
import { getAdminSessionServer } from "@/features/admin/auth/api/admin-session-server";
import { AdminRouteBoundary } from "@/features/admin/auth/components/admin-route-boundary";
import { adminAuthQueryKeys } from "@/features/admin/auth/query-keys";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";

async function HydratedAdmin({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(adminAuthQueryKeys.session(), await getAdminSessionServer());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminRouteBoundary>{children}</AdminRouteBoundary>
    </HydrationBoundary>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminQueryProvider>
      <Suspense fallback={<BrandLoader className="min-h-dvh" />}>
        <HydratedAdmin>{children}</HydratedAdmin>
      </Suspense>
    </AdminQueryProvider>
  );
}
