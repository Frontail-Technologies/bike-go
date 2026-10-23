import { CustomerHeader } from "@/components/customer/desktop-header";
import { SiteFooter } from "@/components/customer/site-footer";
import { NavTracker } from "@/components/shared/nav-tracker";

export function StackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <NavTracker />
      <CustomerHeader className="hidden md:block" />
      <main id="main" className="min-h-[calc(100dvh-4rem)] flex-1">
        {children}
      </main>
      <SiteFooter className="max-lg:pb-24" />
    </div>
  );
}
