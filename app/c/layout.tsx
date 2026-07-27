import type { Metadata } from "next";

// /c/<token> pages are token-gated client results — never indexable.
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default function ClientResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
