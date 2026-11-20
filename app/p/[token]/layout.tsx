import type { Metadata } from "next";

// Private deal pages: never indexed, never cached by shared caches.
export const metadata: Metadata = {
  title: { absolute: "Your proposal · 6 Signal" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
