import { Screen } from "@/components/shared/screen";
import { BlockSkeleton, MotorcycleCardSkeleton } from "@/components/ui/skeleton";

/** Route-level fallback. Same wrapper, padding and columns as BrowseView, so nothing shifts when it loads. */
export function BrowseSkeleton() {
  return (
    <div role="status" aria-label="Loading bikes">
      <div className="sticky top-0 z-30 flex h-14 items-center border-b border-line bg-surface/95 px-4 pt-(--safe-top) md:hidden">
        <BlockSkeleton className="h-6 w-20" />
      </div>
      <Screen bottom="nav" className="flex flex-col gap-4 md:gap-6">
        <div className="hidden flex-col gap-1 md:flex">
          <BlockSkeleton className="h-8 w-28" />
          <BlockSkeleton className="h-5 w-16" />
        </div>
        <BlockSkeleton className="h-12 w-full rounded-control md:hidden" />
        <div className="hidden gap-2 md:flex">
          <BlockSkeleton className="h-12 flex-1 rounded-control" />
        </div>
        <BlockSkeleton className="hidden h-12 w-full rounded-full md:block" />
        <div className="flex items-start gap-8">
          <BlockSkeleton className="hidden h-128 w-72 shrink-0 rounded-card lg:block" />
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <MotorcycleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Screen>
    </div>
  );
}
