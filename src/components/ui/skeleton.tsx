import { Skeleton } from "@heroui/react";
import { cn } from "@/lib/cn";

export { Skeleton };

export function MotorcycleCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-testid="card-skeleton"
      className={cn("flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card", className)}
    >
      <Skeleton className="aspect-4/3 w-full rounded-control" />
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-full rounded-control" />
        <Skeleton className="h-5 w-2/3 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton aria-hidden className={cn("rounded-card", className)} />;
}
