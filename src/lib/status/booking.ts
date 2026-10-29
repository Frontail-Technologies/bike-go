export const bookingStatus = {
  pending: { label: "Pending", labelKey: "statusPending", tone: "pending" },
  confirmed: { label: "Confirmed", labelKey: "statusConfirmed", tone: "confirmed" },
  ready_for_pickup: { label: "Ready for Pickup", labelKey: "statusReadyForPickup", tone: "ready-for-pickup" },
  active: { label: "On Rent", labelKey: "statusActive", tone: "ongoing" },
  returned: { label: "Returned", labelKey: "statusReturned", tone: "returned" },
  completed: { label: "Completed", labelKey: "statusCompleted", tone: "completed" },
  cancelled: { label: "Cancelled", labelKey: "statusCancelled", tone: "cancelled" },
  expired: { label: "Expired", labelKey: "statusExpired", tone: "expired" },
  no_show: { label: "No Show", labelKey: "statusNoShow", tone: "no-show" },
} as const;

export type SharedBookingStatus = keyof typeof bookingStatus;

export const paymentStatus = {
  unpaid: { label: "Unpaid", tone: "unpaid" }, pending: { label: "Pending", tone: "pending" }, paid: { label: "Paid", tone: "paid" },
  failed: { label: "Failed", tone: "failed" }, refunded: { label: "Refunded", tone: "refunded" }, partially_refunded: { label: "Partially refunded", tone: "partially-refunded" },
} as const;
