import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqView } from "@/features/help/faq-view";

export const metadata: Metadata = { title: "Questions" };

// useSearchParams (the ?open= deep link) needs a Suspense boundary.
export default function FaqPage() {
  return (
    <Suspense fallback={null}>
      <FaqView />
    </Suspense>
  );
}
