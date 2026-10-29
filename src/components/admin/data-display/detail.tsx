import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DetailCard({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}><header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold">{title}</h2>{action}</header>{children}</section>;
}

export function DetailRow({ label, icon, children, align = "right" }: { label: string; icon?: ReactNode; children: ReactNode; align?: "right" | "stack" }) {
  if (icon) return <div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--admin-surface-muted) text-(--admin-muted)">{icon}</span><div className="min-w-0 flex-1"><dt className="text-[11px] font-medium text-(--admin-muted)">{label}</dt><dd className="wrap-break-word text-sm font-semibold">{children}</dd></div></div>;
  return <div className={cn("flex items-start gap-4 text-sm", align === "right" ? "justify-between" : "flex-col")}><dt className="shrink-0 text-(--admin-muted)">{label}</dt><dd className={cn("min-w-0 wrap-break-word font-semibold", align === "right" && "text-right")}>{children}</dd></div>;
}
