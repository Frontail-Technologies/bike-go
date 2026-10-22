"use client";

import { BellIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocationPicker } from "@/components/customer/location-picker";
import { customerNav, isActive } from "@/components/customer/nav-items";
import { Logo } from "@/components/shared/logo";
import { IconButton } from "@/components/ui/button";
import { initials, profileStore } from "@/features/profile/store";
import { cn } from "@/lib/cn";

/**
 * Sticky top bar.
 * Mobile: just the logo and notifications; the bottom nav carries navigation and Home shows the city row.
 * From 768px: primary links and the profile avatar join in; the pickup city joins from 1024px.
 */
export function CustomerHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const profile = profileStore.useValue();

  return (
    <header className={cn("sticky top-0 z-30 border-b border-line bg-surface/90 pt-[var(--safe-top)] backdrop-blur-md", className)}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-page md:gap-4">
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

        <div className="ml-auto flex items-center gap-1">
          <LocationPicker className="hidden lg:inline-flex" />
          <IconButton label="Notifications" icon={<BellIcon size={24} />} />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="hidden size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink md:flex"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
              {initials(profile.name)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
