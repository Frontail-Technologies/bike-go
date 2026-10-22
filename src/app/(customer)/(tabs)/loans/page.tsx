import type { Metadata } from "next";
import { LoansLanding } from "@/features/loans/loans-landing";

export const metadata: Metadata = { title: "Expat loans" };

export default function LoansPage() {
  return <LoansLanding />;
}
