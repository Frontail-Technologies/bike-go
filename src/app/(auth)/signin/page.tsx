import type { Metadata, Viewport } from "next";
import { WelcomeScreen } from "@/features/auth/welcome-screen";

export const metadata: Metadata = { title: "Sign in" };

// The welcome screen is dark edge to edge, so the status bar should be too.
export const viewport: Viewport = { themeColor: "#111111" };

export default function SignInPage() {
  return <WelcomeScreen />;
}
