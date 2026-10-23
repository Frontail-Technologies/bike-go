import type { Metadata, Viewport } from "next";
import { WelcomeScreen } from "@/features/auth/welcome-screen";

export const metadata: Metadata = { title: "Sign in" };

export const viewport: Viewport = { themeColor: "#111111" };

export default function SignInPage() {
  return <WelcomeScreen />;
}
