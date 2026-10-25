import type { Metadata } from "next";
import { BookingsView } from "@/features/bookings/bookings-view";
import { CustomerAuthBoundary } from "@/features/auth/customer-auth-boundary";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage() {
  return <CustomerAuthBoundary><BookingsView /></CustomerAuthBoundary>;
}
