import type { Metadata } from "next";
import { ProfileView } from "@/features/profile/profile-view";
import { CustomerAuthBoundary } from "@/features/auth/customer-auth-boundary";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <CustomerAuthBoundary><ProfileView /></CustomerAuthBoundary>;
}
