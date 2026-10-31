import "@/components/admin/admin-theme.module.css";
import { AdminPageSkeleton } from "./admin-page-skeleton";

export function AdminShellSkeleton() {
  return (
    <div data-admin-ui className="adminRoot flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-58 shrink-0 flex-col gap-5 bg-(--admin-sidebar) p-3 lg:flex">
        <div className="h-10 w-32 rounded-lg bg-white/10" />
        <div className="space-y-2">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="h-9 rounded-lg bg-white/5" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 border-b border-(--admin-border) bg-white lg:hidden" />
        <div className="sticky top-0 hidden h-16 items-center border-b border-(--admin-border) bg-white/85 px-6 lg:flex">
          <div className="h-10 w-full max-w-md rounded-xl bg-(--admin-surface-muted)" />
        </div>
        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <AdminPageSkeleton />
        </main>
      </div>
    </div>
  );
}
