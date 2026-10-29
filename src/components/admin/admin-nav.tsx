"use client";

import Link from "next/link";
import { useState } from "react";
import { adminNavigation } from "@/components/admin/config";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAdminSessionQuery } from "@/features/admin/auth/hooks/use-admin-session-query";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export const adminNav = adminNavigation;
const highFrequencyRoutes = new Set(["/admin", "/admin/vehicles", "/admin/bookings", "/admin/customers", "/admin/loans", "/admin/documents"]);

type AdminNavListProps = {
  activeHref: string;
  collapsed?: boolean;
  onNavigate?: (href: string) => void;
};

export function AdminNavList({
  activeHref,
  collapsed = false,
  onNavigate,
}: AdminNavListProps) {
  const session = useAdminSessionQuery();
  const t = useAdminTranslations();
  const hydrated = useHydrated();
  const [navigationIntent, setNavigationIntent] = useState<{ href: string; from: string } | null>(null);
  const effectiveHref = navigationIntent?.from === activeHref ? navigationIntent.href : activeHref;
  return (
    <ul className="flex flex-col gap-1">
      {adminNavigation.filter((item) => !item.superAdminOnly || hydrated && session.data?.role === "super_admin").map(({ href, labelKey, Icon }) => {
        const label = t(`nav.${labelKey}`);
        const active = href === "/admin" ? effectiveHref === href : effectiveHref.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              prefetch={highFrequencyRoutes.has(href) ? true : undefined}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              onClick={(event) => {
                if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setNavigationIntent({ href, from: activeHref });
                onNavigate?.(href);
              }}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-(--admin-accent)",
                collapsed && "justify-center px-0",
                active
                  ? "bg-(--admin-accent) font-bold text-[#111820]"
                  : "font-medium text-(--admin-sidebar-muted) hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon
                size={19}
                weight={active ? "fill" : "regular"}
                aria-hidden
              />
              {collapsed ? null : <span className="truncate">{label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
