import type { Metadata } from "next";
import { ProfileView } from "@/features/customer/profile/components/profile-view";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <CustomerAuthBoundary><ProfileView /></CustomerAuthBoundary>;
}
