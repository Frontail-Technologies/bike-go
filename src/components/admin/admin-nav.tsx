"use client";

import Link from "next/link";
import { adminNavigation } from "@/components/admin/config";
import { cn } from "@/lib/cn";

export const adminNav = adminNavigation;

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
  return (
    <ul className="flex flex-col gap-1">
      {adminNavigation.map(({ href, label, Icon }) => {
        const active =
          href === "/admin" ? activeHref === href : activeHref.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              onClick={(event) => {
                if (onNavigate) {
                  event.preventDefault();
                  onNavigate(href);
                }
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
