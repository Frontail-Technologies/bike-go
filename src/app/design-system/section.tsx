import { cn } from "@/lib/cn";

export const sectionList = [
  { id: "foundations", label: "Foundations" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Forms" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Data" },
  { id: "ridego", label: "RideGo" },
  { id: "motion", label: "Motion" },
] as const;

type SectionProps = {
  id: (typeof sectionList)[number]["id"];
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-32 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-2xl font-extrabold tracking-tight">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-sm text-subtle">{description}</p> : null}
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

export function Demo({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className={cn("rounded-card border border-line bg-surface p-3 shadow-card sm:p-4 md:p-6", className)}>{children}</div>
    </div>
  );
}
