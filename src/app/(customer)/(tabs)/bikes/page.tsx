import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseView } from "@/features/customer/vehicles/components/browse/browse-view";
import { BrowseSkeleton } from "@/features/customer/vehicles/components/browse/browse-skeleton";

export const metadata: Metadata = { title: "Bikes" };

export default function BikesPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseView />
    </Suspense>
  );
}
