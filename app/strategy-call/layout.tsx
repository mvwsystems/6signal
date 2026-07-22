import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The $197 Strategy Call | 6Signal",
  description:
    "One hour, live with the operator. We walk through your AI Visibility Audit layer by layer — where you appear, where competitors are filling your gaps, and what to fix first. Includes the Strategy Brief at no extra charge.",
  openGraph: {
    title: "The $197 Strategy Call | 6Signal",
    description:
      "One hour, live with the operator. We walk through your AI Visibility Audit layer by layer — and you leave with a clear execution decision.",
    type: "website",
    images: [{ url: "/og-social.jpg" }],
  },
};

export default function StrategyCallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
