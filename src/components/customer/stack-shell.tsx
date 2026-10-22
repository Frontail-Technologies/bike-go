import { CustomerHeader } from "@/components/customer/desktop-header";
import { SiteFooter } from "@/components/customer/site-footer";
import { NavTracker } from "@/components/shared/nav-tracker";

/**
 * Pushed screens (bike details, filters, booking steps, booking details). Never shows the bottom nav:
 * on phones each screen brings its own AppBar and pinned action; from 768px the website header returns.
 */
export function StackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <NavTracker />
      <CustomerHeader className="hidden md:block" />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* On tablets some screens pin an action bar to the bottom edge; keep the footer clear of it. */}
      <SiteFooter className="max-lg:pb-24" />
    </div>
  );
}
