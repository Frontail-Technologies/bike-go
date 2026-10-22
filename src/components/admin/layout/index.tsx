import { Card, Surface } from "@heroui/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

export function PageHeader({ title, description, eyebrow, actions, className }: { title: string; description?: string; eyebrow?: string; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col justify-between gap-4 sm:flex-row sm:items-start", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--admin-warning)]">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ContentSection({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Surface className={cn("adminSurface overflow-hidden rounded-2xl", className)}>
      {title || description || actions ? (
        <header className="flex flex-col justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4 sm:flex-row sm:items-center">
          <div>{title ? <h2 className="text-base font-extrabold">{title}</h2> : null}{description ? <p className="mt-0.5 text-sm text-[var(--admin-muted)]">{description}</p> : null}</div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </Surface>
  );
}

export function SplitPanel({ primary, secondary, className }: { primary: ReactNode; secondary: ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]", className)}><div className="min-w-0">{primary}</div><div className="min-w-0">{secondary}</div></div>;
}

export function InfoCard({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={cn("adminSurface rounded-2xl", className)}><Card.Header className="flex flex-row items-center justify-start gap-2 px-5 pb-0 pt-5 text-left">{icon ? <span className="text-[var(--admin-warning)]">{icon}</span> : null}<Card.Title className="text-sm font-extrabold">{title}</Card.Title></Card.Header><Card.Content className="px-5 pb-5 pt-4">{children}</Card.Content></Card>;
}

export function DetailList({ items, columns = 1 }: { items: ReadonlyArray<{ label: string; value: ReactNode }>; columns?: 1 | 2 }) {
  return <dl className={cn("grid gap-x-6 gap-y-4", columns === 2 && "sm:grid-cols-2")}>{items.map((item) => <div key={item.label}><dt className="text-xs font-medium text-[var(--admin-muted)]">{item.label}</dt><dd className="mt-1 text-sm font-semibold">{item.value}</dd></div>)}</dl>;
}
