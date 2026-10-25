import type { Metadata } from "next";
import { LegalHub } from "@/features/customer/legal/components/legal-views";

export const metadata: Metadata = { title: "Legal" };

export default function LegalPage() {
  return <LegalHub />;
}
