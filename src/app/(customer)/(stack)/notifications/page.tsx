import type { Metadata } from "next";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";
import { NotificationsView } from "@/features/customer/notifications/components/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <CustomerAuthBoundary><NotificationsView /></CustomerAuthBoundary>;
}
