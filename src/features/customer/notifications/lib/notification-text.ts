import { formatDateTime } from "@/lib/date";
import { titleCase } from "@/lib/text";
import type { CustomerNotification } from "../types";

const statusTitles: Record<string, string> = {
  pending: "Booking pending",
  confirmed: "Booking confirmed",
  ready_for_pickup: "Ready for pickup",
  active: "Your rental is active",
  returned: "Vehicle returned",
  completed: "Booking completed",
  cancelled: "Booking cancelled",
  expired: "Booking expired",
  no_show: "Marked as no show",
};

export function notificationText(notification: CustomerNotification) {
  const { params } = notification;
  if (notification.code === "pickup_reminder" || notification.code === "return_reminder") {
    const pickup = notification.code === "pickup_reminder";
    return {
      title: pickup ? "Pickup reminder" : "Return reminder",
      detail: `${params.vehicleName ?? "Vehicle"} ${pickup ? "pickup" : "return"} at ${params.scheduledAt ? formatDateTime(params.scheduledAt) : "the scheduled time"} ICT`,
    };
  }
  return {
    title: notification.code === "booking_created" ? "Booking created" : statusTitles[params.status ?? ""] ?? `Booking ${titleCase(params.status ?? "updated")}`,
    detail: [params.vehicleName, params.reference].filter(Boolean).join(" · "),
  };
}
