import type { Metadata } from "next";

const BASE = "https://6signal.co";
const ROUTE = "/visibility-check";

export const metadata: Metadata = {
  title: "AI Visibility Audit — $27 | 6Signal",
  description:
    "Find out if AI recommends your business or your competitor. Enter your info, pay $27, and get your full AI Visibility Audit in under 60 seconds.",
  openGraph: {
    title: "AI Visibility Audit — $27 | 6Signal",
    description:
      "Find out if AI recommends your business or your competitor. Full 8-slide audit specific to your trade, your city, your market.",
    type: "website",
    url: `${BASE}${ROUTE}`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "AI Visibility Audit — 6Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Visibility Audit — $27 | 6Signal",
    description: "Find out if AI recommends your business or your competitor. Full brief in under 60 seconds.",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
  alternates: { canonical: `${BASE}${ROUTE}` },
};

export default function VisibilityCheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
