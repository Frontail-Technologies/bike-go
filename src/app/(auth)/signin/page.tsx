import type { Metadata } from "next";
import { WelcomeScreen } from "@/features/auth/welcome-screen";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <WelcomeScreen />;
}
