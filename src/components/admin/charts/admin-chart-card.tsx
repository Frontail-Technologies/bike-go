import { Surface } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminChartCard({ title, description, actions, children, className }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Surface className={cn("adminSurface overflow-hidden rounded-2xl", className)}>
      <header className="flex min-h-20 flex-col justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-extrabold">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className="p-5">{children}</div>
    </Surface>
  );
}
