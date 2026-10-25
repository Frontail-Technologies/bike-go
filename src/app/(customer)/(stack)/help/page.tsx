import type { Metadata } from "next";
import { HelpView } from "@/features/customer/help/components/help-view";

export const metadata: Metadata = { title: "Help and support" };

export default function HelpPage() {
  return <HelpView />;
}
