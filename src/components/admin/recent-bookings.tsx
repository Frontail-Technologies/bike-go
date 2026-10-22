"use client";

import { formatCambodiaDate } from "@/components/admin/controls";
import { MoneyDisplay } from "@/components/admin/data-display/misc";
import { AdminStatusBadge, type AdminStatus } from "@/components/admin/data-display/status-badge";
import { AnimatedActivityList } from "@/components/motion/animated-activity-list";
import { bookings } from "@/features/mock/data";

export function RecentBookings() {
  return <section aria-labelledby="recent" className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm"><h2 id="recent" className="mb-1 text-base font-bold">Recent bookings</h2><AnimatedActivityList aria-label="Recent bookings" items={bookings.slice(0, 5)} getKey={(booking) => booking.id} className="divide-y divide-[var(--admin-border)]" renderItem={(booking) => <div className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{booking.customer}</p><p className="truncate text-xs text-[var(--admin-muted)]">{booking.bike} · {formatCambodiaDate(booking.startDate, { year: undefined })}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><MoneyDisplay amount={Math.round(booking.total * 100)} className="text-sm" /><AdminStatusBadge status={booking.status as AdminStatus} /></div></div>} /></section>;
}
