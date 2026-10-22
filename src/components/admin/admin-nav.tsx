"use client";

import {
  CalendarCheckIcon,
  CreditCardIcon,
  GearIcon,
  MotorcycleIcon,
  SquaresFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const adminNav = [
  { href: "/admin", label: "Dashboard", Icon: SquaresFourIcon },
  { href: "/admin/bikes", label: "Fleet", Icon: MotorcycleIcon },
  { href: "/admin/bookings", label: "Bookings", Icon: CalendarCheckIcon },
  { href: "/admin/customers", label: "Customers", Icon: UsersIcon },
  { href: "/admin/payments", label: "Payments", Icon: CreditCardIcon },
  { href: "/admin/settings", label: "Settings", Icon: GearIcon },
] as const;

type AdminNavListProps = {
  activeHref: string;
  collapsed?: boolean;
  onNavigate?: (href: string) => void;
};

export function AdminNavList({ activeHref, collapsed = false, onNavigate }: AdminNavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {adminNav.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? activeHref === href : activeHref.startsWith(href);
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
                "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink",
                collapsed && "justify-center px-0",
                active ? "bg-brand font-bold text-ink" : "font-medium text-subtle hover:bg-surface-secondary hover:text-ink",
              )}
            >
              <Icon size={20} weight={active ? "fill" : "regular"} />
              {collapsed ? null : label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
