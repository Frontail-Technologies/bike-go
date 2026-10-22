"use client";

import { usePathname } from "next/navigation";
import { CustomerHeader } from "@/components/customer/desktop-header";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";
import { cn } from "@/lib/cn";

/** Focused flows hide the bottom nav so the primary action owns the bottom edge. */
const FOCUSED = /\/book$/;

/**
 * Customer layout foundation: sticky header, a content area that reserves room
 * for the fixed bottom nav (plus safe area) on mobile, and the nav itself.
 */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focused = FOCUSED.test(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <CustomerHeader />
      <main
        id="main"
        className={cn(
          "mx-auto w-full max-w-7xl flex-1 px-page py-4 md:py-8 md:pb-12",
          focused ? "pb-[calc(var(--safe-bottom)+24px)]" : "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+24px)]",
        )}
      >
        {children}
      </main>
      {focused ? null : <MobileBottomNav />}
    </div>
  );
}
