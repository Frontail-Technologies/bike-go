"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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

  if (session.isPending || !session.data) {
    return <div className="flex min-h-[40dvh] items-center justify-center" role="status" aria-live="polite"><span className="text-sm text-subtle">Checking your session…</span></div>;
  }

  return children;
}
