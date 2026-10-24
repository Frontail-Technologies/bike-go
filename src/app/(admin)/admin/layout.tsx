import { AdminQueryProvider } from "@/components/admin/providers/admin-query-provider";
import { AdminRouteBoundary } from "@/features/admin/auth/components/admin-route-boundary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminQueryProvider><AdminRouteBoundary>{children}</AdminRouteBoundary></AdminQueryProvider>;
}
