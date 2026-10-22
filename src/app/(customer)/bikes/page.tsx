import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseView } from "@/features/browse/browse-view";
import { BrowseSkeleton } from "@/features/browse/browse-skeleton";

export const metadata: Metadata = { title: "Bikes" };

export default function BikesPage() {
  // useSearchParams needs a Suspense boundary; the skeleton mirrors the final layout.
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseView />
    </Suspense>
  );
}
