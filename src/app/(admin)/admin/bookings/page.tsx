import { Suspense } from "react";
import { AdminLoadingState } from "@/components/admin/feedback";
import { BookingList } from "@/features/admin/bookings/components/booking-list";

export default function BookingsPage() {
  return <Suspense fallback={<AdminLoadingState labelKey="ui.loadingLabels.bookings" />}><BookingList /></Suspense>;
}
