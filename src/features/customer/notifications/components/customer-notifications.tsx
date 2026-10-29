"use client";

import { useEffect } from "react";
import { useBookingStatusNotifications } from "../hooks/use-booking-status-notifications";

export function CustomerNotifications() {
  useBookingStatusNotifications();

  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js");
  }, []);

  return null;
}
