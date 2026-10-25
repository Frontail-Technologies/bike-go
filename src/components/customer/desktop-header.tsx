"use client";

import { BellIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocationPicker } from "@/components/customer/location-picker";
import { headerNav, isActive } from "@/components/customer/nav-items";
import {
  AnimatedSelection,
  SelectionIndicator,
} from "@/components/motion/animated-selection";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Logo } from "@/components/shared/logo";
import { IconButton } from "@/components/ui/button";
import { useOptimisticNav } from "@/hooks/use-optimistic-nav";
import { useTranslations } from "@/i18n/hooks";
import { initials, profileStore } from "@/features/customer/profile/stores/preferences-store";
import { cn } from "@/lib/cn";

const RADIUS = 12;

export function CustomerHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const { current, navigate } = useOptimisticNav(pathname);
  const profile = profileStore.useValue();
  const t = useTranslations("nav");
  const common = useTranslations("common");

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-line bg-surface/90 pt-[var(--safe-top)] backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-page md:gap-4">
        <Logo />

        <nav aria-label={t("primary")} className="ml-6 hidden md:block">
          <AnimatedSelection>
            <div className="flex items-center gap-1">
              {headerNav.map(({ href, key }) => {
                const active = isActive(current, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => navigate(href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative isolate flex min-h-11 items-center rounded-control px-4 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink",
                      active
                        ? "font-bold text-ink"
                        : "font-medium text-subtle hover:bg-surface-secondary hover:text-ink",
                    )}
                  >
                    {active ? (
                      <SelectionIndicator
                        className="bg-brand"
                        radius={RADIUS}
                      />
                    ) : null}
                    {t(key)}
                  </Link>
                );
              })}
            </div>
          </AnimatedSelection>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LocationPicker className="hidden lg:inline-flex" />
          <LanguageSwitcher variant="compact" />
          <IconButton label={common("notifications")} icon={<BellIcon size={24} />} />
          <Link
            href="/profile"
            aria-label={t("yourProfile")}
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
