"use client";

import { BellIcon } from "@phosphor-icons/react";
import { Avatar } from "@heroui/react";
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
import { useOptimisticNav } from "@/hooks/use-optimistic-nav";
import { useTranslations } from "@/i18n/hooks";
import { useCustomerSessionQuery } from "@/features/customer/auth/hooks/use-customer-session-query";
import { useCustomerProfileQuery } from "@/features/customer/profile/hooks/use-profile";
import { initials } from "@/lib/text";
import { cn } from "@/lib/cn";

const RADIUS = 12;

export function CustomerHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const { current, navigate } = useOptimisticNav(pathname);
  const session = useCustomerSessionQuery();
  const profile = useCustomerProfileQuery({ enabled: Boolean(session.data) });
  const customerName = profile.data?.fullName?.trim() || session.data?.user.name?.trim() || session.data?.user.email || null;
  const avatarUrl = profile.data?.avatarUrl || session.data?.user.image || null;
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const auth = useTranslations("auth");

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
                        ? "font-bold text-brand-foreground"
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
          <Link href="/notifications" aria-label={common("notifications")} className="flex size-11 items-center justify-center rounded-control outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-ink">
            <BellIcon size={24} />
          </Link>
          {session.data ? (
            <Link href="/profile" aria-label={t("yourProfile")} className="hidden size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink md:flex">
              <Avatar size="sm">
                {avatarUrl ? <Avatar.Image src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
                <Avatar.Fallback className="bg-ink text-xs font-bold text-white">{customerName ? initials(customerName) : "?"}</Avatar.Fallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/signin" className="hidden h-10 items-center rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ink active:scale-[0.97] md:flex">
              {auth("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
