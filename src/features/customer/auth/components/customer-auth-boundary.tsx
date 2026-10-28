"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BrandLoader } from "@/components/customer/brand-loader";
import { useCustomerSessionQuery } from "../hooks/use-customer-session-query";

export function CustomerAuthBoundary({ children }: { children: ReactNode }) {
  const session = useCustomerSessionQuery();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!session.isPending && !session.data) {
      const current = `${pathname}${window.location.search}`;
      router.replace(`/signin?returnTo=${encodeURIComponent(current)}`);
    }
  }, [pathname, router, session.data, session.isPending]);

  // Keep already-hydrated content visible during a background refresh. Blocking
  // on `isFetching` here caused a full-page loader on ordinary client navigation.
  if (session.isPending || !session.data) {
    return <BrandLoader />;
  }

  return children;
}
