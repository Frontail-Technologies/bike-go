"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { customerNav, isActive } from "@/components/customer/nav-items";
import { AnimatedSelection, SelectionIndicator } from "@/components/motion/animated-selection";
import { useOptimisticNav } from "@/hooks/use-optimistic-nav";
import { cn } from "@/lib/cn";

type MobileBottomNavProps = {
  /** Override the router-derived active href (used by the design-system demo). */
  activeHref?: string;
  onNavigate?: (href: string) => void;
  /** Fixed to the viewport by default; the showcase renders it inline. */
  inline?: boolean;
  className?: string;
};

export function MobileBottomNav({ activeHref, onNavigate, inline = false, className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const optimistic = useOptimisticNav(pathname);
  const current = activeHref ?? optimistic.current;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "z-40 border-t border-line bg-surface/95 pb-safe shadow-nav backdrop-blur-md",
        inline ? "relative" : "fixed inset-x-0 bottom-0 md:hidden",
        className,
      )}
    >
      <AnimatedSelection>
        <ul className="mx-auto flex h-16 max-w-md items-stretch px-2">
          {customerNav.map(({ href, label, Icon }) => {
            const active = isActive(current, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => {
                    if (onNavigate) {
                      event.preventDefault();
                      onNavigate(href);
                    } else {
                      optimistic.navigate(href);
                    }
                  }}
                  className="relative isolate flex h-full min-h-11 flex-col items-center justify-center gap-1 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-inset active:scale-95 motion-safe:transition-transform motion-safe:duration-150"
                >
                  {active ? (
                    <SelectionIndicator
                      className="inset-x-auto top-0 bottom-auto left-1/2 h-1 w-8 -translate-x-1/2 bg-brand"
                      radius={4}
                    />
                  ) : null}
                  <Icon size={24} weight={active ? "fill" : "regular"} className={active ? "text-brand" : "text-subtle"} />
                  <span className={cn("text-[11px] leading-none", active ? "font-bold text-ink" : "font-medium text-subtle")}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </AnimatedSelection>
    </nav>
  );
}
