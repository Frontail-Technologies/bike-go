import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design system",
  description: "RideGo components, tokens and patterns.",
};

export default function DesignSystemPage() {
  return <Showcase />;
}
