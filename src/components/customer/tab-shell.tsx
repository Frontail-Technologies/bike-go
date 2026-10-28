import { CustomerHeader } from "@/components/customer/desktop-header";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";
import { SiteFooter } from "@/components/customer/site-footer";
import { NavTracker } from "@/components/shared/nav-tracker";
import { CustomerNotifications } from "@/features/customer/notifications/components/customer-notifications";
import { CustomerSessionExpiryListener } from "@/features/customer/auth/components/customer-session-expiry-listener";
import { SignInPrompt } from "@/features/customer/auth/components/sign-in-prompt";

export function TabShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <NavTracker />
      <CustomerSessionExpiryListener />
      <SignInPrompt />
      <CustomerNotifications />
      <CustomerHeader className="hidden md:block" />
      <main id="main" className="min-h-[calc(100dvh-4rem)] flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
