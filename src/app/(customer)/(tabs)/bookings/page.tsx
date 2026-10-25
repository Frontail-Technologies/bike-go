import type { Metadata } from "next";
import { BookingsView } from "@/features/customer/bookings/components/bookings-view";
import { CustomerAuthBoundary } from "@/features/customer/auth/components/customer-auth-boundary";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage() {
  return <CustomerAuthBoundary><BookingsView /></CustomerAuthBoundary>;
}
