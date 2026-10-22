import type { Metadata } from "next";
import { ApplicationsView } from "@/features/loans/applications-view";

export const metadata: Metadata = { title: "My applications" };

export default function ApplicationsPage() {
  return <ApplicationsView />;
}
