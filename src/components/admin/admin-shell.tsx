"use client";

import { Suspense, useState } from "react";
import "@/components/admin/admin-theme.module.css";
import { AdminHeader } from "@/components/admin/shell/admin-header";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/shell/admin-sidebar";

/** Admin layout foundation: collapsible sidebar on `lg+`, drawer bar below. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div data-admin-ui className="adminRoot flex min-h-dvh">
      <Suspense fallback={<aside aria-label="Admin" className="hidden h-dvh w-[232px] shrink-0 bg-[var(--admin-sidebar)] lg:block" />}>
        <AdminSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-14 border-b border-[var(--admin-border)] bg-white lg:hidden" />}>
          <AdminMobileBar />
        </Suspense>
        <AdminHeader />
        <main id="main" className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="adminReveal mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
