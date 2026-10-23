import { Screen } from "@/components/shared/screen";
import { LoadingRegion } from "@/components/ui/loading-region";
import { BlockSkeleton, MotorcycleCardSkeleton } from "@/components/ui/skeleton";

function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <BlockSkeleton className="h-6 w-40 rounded-full" />
      <BlockSkeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <LoadingRegion>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 pt-(--safe-top) md:hidden">
        <BlockSkeleton className="h-7 w-24" />
        <BlockSkeleton className="size-10 rounded-full" />
      </div>
      <Screen bottom="nav" className="flex flex-col gap-6 md:gap-10">
        <div className="flex flex-col gap-4">
          <BlockSkeleton className="h-12 w-full rounded-control lg:hidden" />
          <BlockSkeleton className="h-52 w-full md:h-80 md:rounded-overlay" />
          <div className="flex gap-2">
            <BlockSkeleton className="h-12 flex-1 rounded-control" />
            <BlockSkeleton className="size-12 shrink-0 rounded-control" />
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-1">
              <BlockSkeleton className="size-16 rounded-full" />
              <BlockSkeleton className="h-4 w-12 rounded-full" />
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <SectionHeadingSkeleton />
          <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <MotorcycleCardSkeleton key={i} className="w-[46%] shrink-0 sm:w-[36%] md:w-auto" />
            ))}
          </div>
        </section>

        <BlockSkeleton className="h-24 w-full" />

        <section className="flex flex-col gap-4">
          <SectionHeadingSkeleton />
          <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:gap-4 md:px-0">
            {Array.from({ length: 3 }, (_, i) => (
              <BlockSkeleton key={i} className="h-56 w-[78%] shrink-0 md:w-[calc((100%-2rem)/3)]" />
            ))}
          </div>
        </section>

        <BlockSkeleton className="h-36 w-full md:h-52 md:rounded-overlay" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <BlockSkeleton key={i} className="h-32" />
          ))}
        </div>
      </Screen>
    </LoadingRegion>
  );
}
