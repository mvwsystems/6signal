import type { Metadata, Viewport } from "next";

// Dashboard-only metadata: saving /dashboard to an iPhone home screen gets the
// yellow chevron mark and opens standalone (full-screen, no Safari chrome).
export const metadata: Metadata = {
  title: "6 Signal — Command Center",
  icons: {
    apple: "/6SIGYellow.png",
    icon: "/6SIGYellow.png",
  },
  appleWebApp: {
    capable: true,
    title: "6 Signal",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#060606",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
