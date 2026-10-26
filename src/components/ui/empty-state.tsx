import { EmptyState as HeroEmptyState } from "@heroui/react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, action, className }: EmptyStateProps) {
  return (
    <HeroEmptyState className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-ink">{icon}</span>
      <h3 className="text-base font-bold">{title}</h3>
      {action}
    </HeroEmptyState>
  );
}
