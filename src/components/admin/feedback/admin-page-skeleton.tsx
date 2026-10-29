"use client";

import { Skeleton } from "@heroui/react";
import { useAdminTranslations } from "@/features/admin/i18n/hooks";

export function AdminPageSkeleton() {
  const t = useAdminTranslations();
  return <div aria-busy="true" aria-label={t("ui.loadingPage")} role="status" className="skeleton--shimmer relative isolate mx-auto w-full max-w-[1600px] space-y-6 overflow-hidden">
    <div className="flex min-h-16 items-start justify-between gap-4">
      <div className="space-y-3"><Skeleton animationType="none" className="h-8 w-48 rounded-lg" /><Skeleton animationType="none" className="h-4 w-80 max-w-[70vw] rounded-lg" /></div>
      <Skeleton animationType="none" className="hidden h-11 w-32 rounded-xl sm:block" />
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Skeleton animationType="none" className="h-28 rounded-2xl" /><Skeleton animationType="none" className="h-28 rounded-2xl" /><Skeleton animationType="none" className="h-28 rounded-2xl" /><Skeleton animationType="none" className="h-28 rounded-2xl" /></div>
    <div className="adminSurface overflow-hidden rounded-2xl">
      <div className="flex gap-3 border-b border-[var(--admin-border)] p-4"><Skeleton animationType="none" className="h-11 flex-1 rounded-xl" /><Skeleton animationType="none" className="h-11 w-36 rounded-xl" /><Skeleton animationType="none" className="hidden h-11 w-36 rounded-xl md:block" /></div>
      <div className="space-y-0 divide-y divide-[var(--admin-border)] px-4">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex h-16 items-center gap-4"><Skeleton animationType="none" className="size-9 shrink-0 rounded-lg" /><Skeleton animationType="none" className="h-4 w-1/4 rounded" /><Skeleton animationType="none" className="h-4 flex-1 rounded" /><Skeleton animationType="none" className="h-6 w-20 rounded-full" /></div>)}</div>
    </div>
    <span className="sr-only">{t("ui.loadingPage")}</span>
  </div>;
}
