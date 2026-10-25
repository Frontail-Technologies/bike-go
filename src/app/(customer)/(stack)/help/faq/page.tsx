import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqView } from "@/features/customer/help/components/faq-view";

export const metadata: Metadata = { title: "Questions" };

export default function FaqPage() {
  return (
    <Suspense fallback={null}>
      <FaqView />
    </Suspense>
  );
}
