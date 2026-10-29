import { AdminQueryProvider } from "@/components/admin/providers/admin-query-provider";
import { BrandLoader } from "@/components/customer/brand-loader";
import { getAdminSessionServer } from "@/features/admin/auth/api/admin-session-server";
import { AdminRouteBoundary } from "@/features/admin/auth/components/admin-route-boundary";
import { adminAuthQueryKeys } from "@/features/admin/auth/query-keys";
import { ADMIN_LOCALE_COOKIE, defaultAdminLocale, isAdminLocale } from "@/features/admin/i18n/config";
import { AdminI18nProvider } from "@/features/admin/i18n/provider";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";

async function HydratedAdmin({ children }: { children: React.ReactNode }) {
  await connection();
  const queryClient = new QueryClient();
  const [session, cookieStore] = await Promise.all([getAdminSessionServer(), cookies()]);
  queryClient.setQueryData(adminAuthQueryKeys.session(), session);
  const savedLocale = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;
  const locale = isAdminLocale(savedLocale) ? savedLocale : defaultAdminLocale;

  return (
    <AdminI18nProvider initialLocale={locale}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminRouteBoundary>{children}</AdminRouteBoundary>
      </HydrationBoundary>
    </AdminI18nProvider>
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
