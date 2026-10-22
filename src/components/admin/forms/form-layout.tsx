import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return <fieldset className={cn("border-0 p-0", className)}><legend className="text-base font-extrabold">{title}</legend>{description ? <p className="mb-4 mt-1 text-sm text-[var(--admin-muted)]">{description}</p> : <div className="h-4" />}{children}</fieldset>;
}

export function FormGrid({ children, columns = 2, className }: { children: ReactNode; columns?: 1 | 2 | 3; className?: string }) {
  return <div className={cn("grid gap-4", columns === 2 && "md:grid-cols-2", columns === 3 && "md:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}
