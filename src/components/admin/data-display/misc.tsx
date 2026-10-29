import { Avatar } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMinor } from "@/lib/format";
import { initials } from "@/lib/text";

export function MoneyDisplay({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("whitespace-nowrap font-semibold tabular-nums", className)}>{formatMinor(amount)}</span>;
}

export function AvatarCell({ name, detail, src }: { name: string; detail?: string; src?: string }) {
  return <div className="flex min-w-[180px] items-center gap-3"><Avatar size="sm" aria-label={name}>{src ? <Avatar.Image src={src} alt="" /> : null}<Avatar.Fallback>{initials(name)}</Avatar.Fallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-bold">{name}</span>{detail ? <span className="block truncate text-xs text-[var(--admin-muted)]">{detail}</span> : null}</span></div>;
}

export type ActivityState = "done" | "current" | "future" | "failed";
export type ActivityItem = { id: string; title: string; detail?: string; time: string; icon?: ReactNode; tone?: "success" | "warning" | "info"; state?: ActivityState };

const stateStyles: Record<ActivityState, string> = {
  done: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  current: "bg-[var(--admin-accent)] text-[#111820] ring-4 ring-[var(--admin-accent-soft)]",
  future: "border border-dashed border-[var(--admin-border-strong)] bg-white text-[var(--admin-muted)]",
  failed: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
};
export function ActivityTimeline({ items }: { items: ReadonlyArray<ActivityItem> }) {
  return <ol className="space-y-0">{items.map((item, index) => <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">{index < items.length - 1 ? <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-[var(--admin-border)]" aria-hidden /> : null}<span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full", item.state ? stateStyles[item.state] : item.tone === "success" ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : item.tone === "warning" ? "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" : "bg-[#efe9ff] text-[#6246c7]")}>{item.icon ?? <span className="size-2 rounded-full bg-current" />}</span><div className="min-w-0 pt-1"><p className={cn("text-sm font-bold", item.state === "future" && "text-[var(--admin-muted)]")}>{item.title}</p>{item.detail ? <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{item.detail}</p> : null}<time className="mt-1 block text-[11px] text-[var(--admin-muted)]">{item.time}</time></div></li>)}</ol>;
}
