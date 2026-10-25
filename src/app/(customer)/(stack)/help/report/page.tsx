import type { Metadata } from "next";
import { ReportIssueView } from "@/features/customer/help/components/report-issue-view";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

export const metadata: Metadata = { title: "Report an issue" };

export default function ReportPage() {
  return <CustomerAuthBoundary><ReportIssueView /></CustomerAuthBoundary>;
}
