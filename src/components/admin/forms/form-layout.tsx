import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return <fieldset className={cn("border-0 p-0", className)}><legend className="text-base font-extrabold">{title}</legend>{description ? <p className="mb-4 mt-1 text-sm text-[var(--admin-muted)]">{description}</p> : <div className="h-4" />}{children}</fieldset>;
}

export function FormGrid({ children, columns = 2, className }: { children: ReactNode; columns?: 1 | 2 | 3; className?: string }) {
  return <div className={cn("grid gap-4", columns === 2 && "md:grid-cols-2", columns === 3 && "md:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}

export function FormCard({ title, description, icon, children, className }: { title: string; description?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("adminSurface rounded-2xl p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-start gap-3">
        {icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-warning)]">{icon}</span> : null}
        <div className="min-w-0"><h2 className="text-base font-extrabold leading-9 sm:leading-tight">{title}</h2>{description ? <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{description}</p> : null}</div>
      </header>
      {children}
    </section>
  );
}
