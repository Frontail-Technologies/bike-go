import { CustomerHeader } from "@/components/customer/desktop-header";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";
import { SiteFooter } from "@/components/customer/site-footer";
import { NavTracker } from "@/components/shared/nav-tracker";

/**
 * Top-level destinations (Home, Bikes, Bookings, Profile). On phones each screen renders its own AppBar
 * and this shell adds the bottom nav; from 768px the website header replaces both.
 */
export function TabShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <NavTracker />
      <CustomerHeader className="hidden md:block" />
      <main id="main" className="min-h-[calc(100dvh-4rem)] flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
