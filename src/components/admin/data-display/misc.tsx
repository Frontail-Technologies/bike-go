import { Avatar } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function MoneyDisplay({ amount, currency = "USD", className }: { amount: number; currency?: "USD" | "KHR"; className?: string }) {
  const value = currency === "USD" ? amount / 100 : amount;
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: currency === "KHR" ? 0 : 2 }).format(value);
  return <span className={cn("whitespace-nowrap font-semibold tabular-nums", className)}>{formatted}</span>;
}

export function AvatarCell({ name, detail, src }: { name: string; detail?: string; src?: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="flex min-w-[180px] items-center gap-3"><Avatar size="sm">{src ? <Avatar.Image src={src} alt="" /> : null}<Avatar.Fallback>{initials}</Avatar.Fallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-bold">{name}</span>{detail ? <span className="block truncate text-xs text-[var(--admin-muted)]">{detail}</span> : null}</span></div>;
}

export type ActivityItem = { id: string; title: string; detail?: string; time: string; icon?: ReactNode; tone?: "success" | "warning" | "info" };
export function ActivityTimeline({ items }: { items: ReadonlyArray<ActivityItem> }) {
  return <ol className="space-y-0">{items.map((item, index) => <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">{index < items.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-[var(--admin-border)]" aria-hidden /> : null}<span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", item.tone === "success" ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : item.tone === "warning" ? "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" : "bg-[var(--admin-info-soft)] text-[var(--admin-info)]")}>{item.icon ?? <span className="size-2 rounded-full bg-current" />}</span><div className="min-w-0 pt-1"><p className="text-sm font-bold">{item.title}</p>{item.detail ? <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{item.detail}</p> : null}<time className="mt-1 block text-[11px] text-[var(--admin-muted)]">{item.time}</time></div></li>)}</ol>;
}
