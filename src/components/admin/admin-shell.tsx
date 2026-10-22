"use client";

import { useState } from "react";
import "@/components/admin/admin-theme.module.css";
import { AdminHeader } from "@/components/admin/shell/admin-header";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/shell/admin-sidebar";

/** Admin layout foundation: collapsible sidebar on `lg+`, drawer bar below. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div data-admin-ui className="adminRoot flex min-h-dvh">
      <AdminSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar />
        <AdminHeader />
        <main id="main" className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1680px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
