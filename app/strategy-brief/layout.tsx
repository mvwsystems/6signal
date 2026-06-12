import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your AI Visibility Strategy Brief | 6Signal",
  description: "Your full AI Visibility Strategy Brief from 6Signal — content architecture, schema plan, signal-by-signal action plan, and 90-day calendar.",
  robots: { index: false, follow: false },
  openGraph: {
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "6Signal AI Visibility Strategy Brief" }],
  },
};

export default function StrategyBriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
