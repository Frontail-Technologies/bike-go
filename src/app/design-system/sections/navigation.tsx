"use client";

import { MotorcycleIcon, ReceiptIcon, StarIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminQueryProvider } from "@/components/admin/providers/admin-query-provider";
import { CustomerHeader } from "@/components/customer/desktop-header";
import { MobileBottomNav } from "@/components/customer/mobile-bottom-nav";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { Demo, Section } from "../section";

export function NavigationSection() {
  const [navHref, setNavHref] = useState("/");
  const [adminHref, setAdminHref] = useState("/admin");
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(2);

  return (
    <Section
      id="navigation"
      title="Navigation"
      description="Bottom nav below 768px, top bar from 768px, collapsible admin sidebar from 1024px. Demos below are interactive."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <Demo title="Mobile bottom navigation (24px icons, fill when selected)" className="flex justify-center bg-canvas">
          <div className="flex h-[420px] w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] border-[6px] border-ink bg-canvas">
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-subtle">
              Current page: <strong className="ml-1 text-ink">{navHref === "/" ? "Home" : navHref.slice(1)}</strong>
            </div>
            <MobileBottomNav inline activeHref={navHref} onNavigate={setNavHref} />
          </div>
        </Demo>

        <Demo title="Admin sidebar (collapsible)" className="overflow-hidden p-0 md:p-0">
          <div className="flex h-[420px] bg-canvas">
            <AdminQueryProvider>
            <AdminSidebar
              inline
              activeHref={adminHref}
              onNavigate={setAdminHref}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
            />
            </AdminQueryProvider>
            <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-subtle">
              {adminHref === "/admin" ? "Dashboard" : adminHref.replace("/admin/", "")}
            </div>
          </div>
        </Demo>
      </div>

      <Demo title="Top bar (links appear from 768px)" className="overflow-hidden p-0 md:p-0">
        <CustomerHeader className="static" />
      </Demo>

      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Tabs">
          <Tabs
            aria-label="Bike details"
            items={[
              { id: "specs", label: "Specs", icon: <MotorcycleIcon size={20} />, content: <p className="text-sm text-subtle">349cc, single cylinder, 20.2 bhp.</p> },
              { id: "features", label: "Features", icon: <ReceiptIcon size={20} />, content: <p className="text-sm text-subtle">ABS, LED headlamp, USB charging.</p> },
              { id: "reviews", label: "Reviews", icon: <StarIcon size={20} />, content: <p className="text-sm text-subtle">4.8 from 320 riders.</p> },
            ]}
          />
        </Demo>

        <div className="flex flex-col gap-8">
          <Demo title="Breadcrumbs">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Bikes", href: "/bikes" },
                { label: "Royal Enfield Classic 350" },
              ]}
            />
          </Demo>
          <Demo title="Pagination">
            <Pagination page={page} pageCount={9} onPageChange={setPage} summary={`Page ${page} of 9`} />
          </Demo>
        </div>
      </div>
    </Section>
  );
}
