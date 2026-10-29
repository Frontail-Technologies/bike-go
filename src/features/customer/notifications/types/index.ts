export type CustomerNotificationCode =
  | "booking_created"
  | "booking_status_changed"
  | "pickup_reminder"
  | "return_reminder";

export type CustomerNotification = {
  id: string;
  kind: "booking" | "reminder";
  code: CustomerNotificationCode;
  params: { reference?: string; vehicleName?: string; status?: string; scheduledAt?: string };
  occurredAt: string;
  href: string;
};

export type NotificationListParams = { page: number; pageSize: number };
