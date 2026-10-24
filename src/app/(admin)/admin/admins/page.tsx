import { AdminLoadingState } from "@/components/admin/feedback";
import { AdminUsersPage } from "@/features/admin/admin-users/components/admin-users-page";
import { SessionPendingGate } from "@/features/admin/auth/components/session-pending-gate";

export default function AdminUsersRoute() {
  return (
    <SessionPendingGate fallback={<AdminLoadingState label="Loading administrators…" />}>
      <AdminUsersPage />
    </SessionPendingGate>
  );
}
