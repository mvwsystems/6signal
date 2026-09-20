import type { Metadata, Viewport } from "next";

// Dashboard-only metadata: saving /dashboard to an iPhone home screen gets the
// yellow chevron mark and opens standalone (full-screen, no Safari chrome).
export const metadata: Metadata = {
  title: "6 Signal — Command Center",
  robots: { index: false, follow: false, noarchive: true },
  icons: {
    apple: "/6signal-icon-01-primary-1024.png",
    icon: "/6signal-icon-01-primary-1024.png",
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

// Applies the saved light/dark choice before first paint so a light-mode user
// never sees a black flash. Dark is the default; the toggle lives in the header.
const THEME_BOOT = `try{var t=localStorage.getItem("6sig_db_theme");document.documentElement.setAttribute("data-db-theme",t==="light"?"light":"dark")}catch(e){}`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      {children}
    </>
  );
}
