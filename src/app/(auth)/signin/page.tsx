import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { WelcomeScreen } from "@/features/customer/auth/components/welcome-screen";

export const metadata: Metadata = { title: "Sign in" };

export const viewport: Viewport = { themeColor: "#111111" };

export default function SignInPage() {
  return <Suspense fallback={<main className="min-h-dvh bg-ink" />}><WelcomeScreen /></Suspense>;
}
