export async function enableBrowserNotifications() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export function browserNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function showBrowserNotification(title: string, options: NotificationOptions = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
  if (registration) {
    await registration.showNotification(title, { icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", ...options });
    return;
  }
  new Notification(title, { icon: "/icons/icon-192.png", ...options });
}
