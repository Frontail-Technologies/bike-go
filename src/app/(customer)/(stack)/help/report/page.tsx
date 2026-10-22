import type { Metadata } from "next";
import { ReportIssueView } from "@/features/help/report-issue-view";

export const metadata: Metadata = { title: "Report an issue" };

export default function ReportPage() {
  return <ReportIssueView />;
}
