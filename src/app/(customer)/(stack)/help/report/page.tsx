import type { Metadata } from "next";
import { ReportIssueView } from "@/features/help/report-issue-view";
import { CustomerAuthBoundary } from "@/features/auth/customer-auth-boundary";

export const metadata: Metadata = { title: "Report an issue" };

export default function ReportPage() {
  return <CustomerAuthBoundary><ReportIssueView /></CustomerAuthBoundary>;
}
