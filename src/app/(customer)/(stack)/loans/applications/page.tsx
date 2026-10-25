import type { Metadata } from "next";
import { ApplicationsView } from "@/features/customer/loans/components/applications-view";

export const metadata: Metadata = { title: "My applications" };

export default function ApplicationsPage() {
  return <ApplicationsView />;
}
