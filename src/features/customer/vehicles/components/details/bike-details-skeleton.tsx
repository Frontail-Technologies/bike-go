import { Screen } from "@/components/shared/screen";
import { LoadingRegion } from "@/components/ui/loading-region";
import { BlockSkeleton } from "@/components/ui/skeleton";

export function BikeDetailsSkeleton({ variant = "unit" }: { variant?: "unit" | "group" }) {
  const isGroup = variant === "group";
  return (
    <LoadingRegion>
      <Screen bottom="footer" className="flex flex-col gap-4 max-md:px-0! max-md:pt-0 md:pb-28 lg:pb-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-6">
            <BlockSkeleton className="aspect-5/4 w-full max-md:rounded-none md:aspect-4/3" />
            <div className="flex flex-col gap-4 max-md:px-page">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <BlockSkeleton className="h-7 w-2/3" />
                  <BlockSkeleton className="h-5 w-1/3" />
                </div>
                <BlockSkeleton className="h-8 w-20" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <BlockSkeleton key={i} className="h-20 rounded-card" />
                ))}
              </div>
              <BlockSkeleton className="h-14 w-full rounded-card lg:hidden" />
              <BlockSkeleton className="h-40 w-full rounded-card" />
              {isGroup ? (
                <div className="flex flex-col gap-2 lg:hidden">
                  {Array.from({ length: 2 }, (_, i) => (
                    <BlockSkeleton key={i} className="h-16 w-full rounded-card" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="hidden flex-col gap-3 lg:flex">
            <BlockSkeleton className="h-72 rounded-card" />
            {isGroup ? (
              <>
                <BlockSkeleton className="h-16 rounded-card" />
                <BlockSkeleton className="h-16 rounded-card" />
              </>
            ) : null}
          </div>
        </div>
      </Screen>
    </LoadingRegion>
  );
}
