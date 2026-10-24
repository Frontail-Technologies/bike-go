"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  isUnauthenticatedAdmin,
  useAdminSessionQuery,
} from "../hooks/use-admin-session-query";

function sessionReturnTo() {
  if (typeof window === "undefined") return "/admin";

  const destination = `${window.location.pathname}${window.location.search}`;
  return destination.startsWith("/admin") && !destination.startsWith("//")
    ? destination
    : "/admin";
}

/** Resolves the administrator session once at the admin layout boundary. */
export function AdminRouteBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAdminSessionQuery();
  const isLogin = pathname === "/admin/login";
  const isPasswordChange = pathname === "/admin/change-password";

  useEffect(() => {
    if (session.isPending) return;

    if (isLogin) {
      if (session.data) {
        router.replace(session.data.mustChangePassword ? "/admin/change-password" : "/admin");
      }
      return;
    }

    if (isUnauthenticatedAdmin(session.error) || !session.data) {
      router.replace(`/admin/login?returnTo=${encodeURIComponent(sessionReturnTo())}`);
      return;
    }

    if (isPasswordChange) {
      if (!session.data.mustChangePassword) router.replace("/admin");
      return;
    }

    if (session.data.mustChangePassword) router.replace("/admin/change-password");
  }, [isLogin, isPasswordChange, router, session.data, session.error, session.isPending]);

  if (isLogin) return <>{children}</>;

  if (session.isPending || !session.data) {
    return <div data-admin-ui className="min-h-dvh bg-[var(--admin-workspace)]" />;
  }

  if (isPasswordChange) return <>{children}</>;

  if (session.data.mustChangePassword) {
    return <div data-admin-ui className="min-h-dvh bg-[var(--admin-workspace)]" />;
  }

  return <AdminShell>{children}</AdminShell>;
}
