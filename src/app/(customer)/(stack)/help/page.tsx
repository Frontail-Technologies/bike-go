import type { Metadata } from "next";
import { HelpView } from "@/features/help/help-view";

export const metadata: Metadata = { title: "Help and support" };

export default function HelpPage() {
  return <HelpView />;
}
