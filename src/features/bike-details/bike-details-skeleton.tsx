import { BlockSkeleton } from "@/components/ui/skeleton";

export function BikeDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading bike">
      <BlockSkeleton className="aspect-4/3 w-full lg:max-w-3xl" />
      <BlockSkeleton className="h-7 w-2/3" />
      <BlockSkeleton className="h-5 w-1/3" />
      <BlockSkeleton className="h-20 w-full" />
    </div>
  );
}
