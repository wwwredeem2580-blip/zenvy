import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/lib/context/notification";
import { AuthProvider } from "@/lib/context/auth";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { SupportProvider } from "@/lib/context/support";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Zenvy - Event Management Platform",
  description: "Create, manage, and sell tickets for your events with Zenvy - the all-in-one event management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen flex flex-col selection:bg-ink selection:text-bg"
        suppressHydrationWarning
      >
        <NotificationProvider>
          <AuthProvider>
            <SupportProvider>
              <Navbar />
              <main className="flex-1 px-6 md:px-12 max-w-7xl mx-auto w-full">
                {children}
              </main>
              <Footer />
              <NotificationToast />
            </SupportProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
