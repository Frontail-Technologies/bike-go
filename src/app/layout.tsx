import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { AppToaster } from "@/components/ui/toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "RideGo", template: "%s · RideGo" },
  description: "Premium motorcycle rentals with flexible bookings.",
  applicationName: "RideGo",
  // Installed from the home screen on iOS: full screen, with a normal status bar.
  appleWebApp: { capable: true, title: "RideGo", statusBarStyle: "default" },
  // Declaring `apple` here replaces the file-based icon, so the favicon must be listed too or browsers fall back to /favicon.ico (404).
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom in stays available; zooming out below 1 does not, so a stray overflow can never shrink the page.
  minimumScale: 1,
  viewportFit: "cover",
  // White matches the app bars so the status bar blends in. Dark screens (sign-in) override this.
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-dvh flex-col">
        <MotionProvider>{children}</MotionProvider>
        <AppToaster />
      </body>
    </html>
  );
}
