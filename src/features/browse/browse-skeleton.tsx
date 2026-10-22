import { BlockSkeleton, MotorcycleCardSkeleton } from "@/components/ui/skeleton";

/** Route-level fallback. Heights match BrowseView's header, search, tabs and grid. */
export function BrowseSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" role="status" aria-label="Loading bikes">
      <div className="flex flex-col gap-1">
        <BlockSkeleton className="h-7 w-24" />
        <BlockSkeleton className="h-5 w-16" />
      </div>
      <BlockSkeleton className="h-11 w-full rounded-control" />
      <BlockSkeleton className="h-12 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <MotorcycleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
