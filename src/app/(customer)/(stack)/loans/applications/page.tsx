import type { Metadata } from "next";
import { ApplicationsView } from "@/features/customer/loans/components/applications-view";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

export const metadata: Metadata = { title: "My applications" };

export default function ApplicationsPage() {
  return <CustomerAuthBoundary><ApplicationsView /></CustomerAuthBoundary>;
}
