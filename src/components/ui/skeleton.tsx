import { Skeleton } from "@heroui/react";
import { cn } from "@/lib/cn";

export { Skeleton };

export function MotorcycleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-card border border-line bg-surface p-3", className)}>
      <Skeleton className="aspect-4/3 w-full rounded-control" />
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-4 w-1/2 rounded-full" />
    </div>
  );
}
