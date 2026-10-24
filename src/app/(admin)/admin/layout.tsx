import { AdminShell } from "@/components/admin/admin-shell";
import { AdminQueryProvider } from "@/components/admin/providers/admin-query-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminQueryProvider><AdminShell>{children}</AdminShell></AdminQueryProvider>;
}
