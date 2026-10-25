import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/i18n/provider";
import { pendingLocaleScript } from "@/i18n/pending";
import { MotionProvider } from "@/components/motion/motion-provider";
import { AppToaster } from "@/components/ui/toast";
import { CustomerQueryProvider } from "@/components/customer/customer-query-provider";
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
  appleWebApp: { capable: true, title: "RideGo", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: pendingLocaleScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider>
          <CustomerQueryProvider><MotionProvider>{children}</MotionProvider></CustomerQueryProvider>
        </I18nProvider>
        <AppToaster />
      </body>
    </html>
  );
}
