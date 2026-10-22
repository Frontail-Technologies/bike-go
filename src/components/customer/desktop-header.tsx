"use client";

import { BellIcon, MapPinIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { customerNav, isActive } from "@/components/customer/nav-items";
import { Logo } from "@/components/shared/logo";
import { Button, IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Sticky top bar. Mobile: logo + location + alerts. Desktop: adds primary links. */
export function CustomerHeader({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <header className={cn("sticky top-0 z-30 border-b border-line bg-surface/90 pt-[var(--safe-top)] backdrop-blur-md", className)}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-page">
        <Logo />

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 md:flex">
          {customerNav.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-control px-4 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink",
                  active ? "bg-brand font-bold text-ink" : "font-medium text-subtle hover:bg-surface-secondary hover:text-ink",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" className="hidden lg:inline-flex">
            <MapPinIcon size={20} />
            Jaipur, Rajasthan
          </Button>
          <IconButton label="Notifications" icon={<BellIcon size={20} />} />
          <Button size="sm" className="hidden md:inline-flex">
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}
