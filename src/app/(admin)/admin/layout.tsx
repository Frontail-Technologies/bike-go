import { connection } from "next/server";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

// Admin navigation is URL-aware and intentionally rendered at request time.
export const instant = false;

async function DynamicAdminShell({ children }: { children: React.ReactNode }) {
  // HeroUI's responsive drawer reads interaction timing at runtime.
  await connection();
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-dvh bg-[#faf8f2]" />}><DynamicAdminShell>{children}</DynamicAdminShell></Suspense>;
}
