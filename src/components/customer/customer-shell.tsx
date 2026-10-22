import { CustomerHeader } from "@/components/customer/desktop-header";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";

/**
 * Customer layout foundation: sticky header, content area that reserves room
 * for the fixed bottom nav (plus safe area) on mobile, and the nav itself.
 */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <CustomerHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-7xl flex-1 px-page py-6 pb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+24px)] md:py-8 md:pb-12"
      >
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
