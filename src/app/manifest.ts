import type { MetadataRoute } from "next";

/**
 * Makes RideGo installable ("Add to Home screen"): it then opens full screen, with no browser bar, like an app.
 * There is deliberately no service worker yet, so the app needs a connection.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideGo",
    short_name: "RideGo",
    description: "Premium motorcycle rentals with flexible bookings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // White matches the app bars, so the status bar blends in; the brand yellow lives in the icons.
    background_color: "#F7F8FA",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
