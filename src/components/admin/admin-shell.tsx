"use client";

import { useState } from "react";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/admin-sidebar";

/** Admin layout foundation: collapsible sidebar on `lg+`, drawer bar below. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileBar />
        <main id="main" className="w-full flex-1 px-page py-6 pb-[calc(var(--safe-bottom)+24px)] md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
