import type { Metadata } from "next";

const BASE = "https://6signal.co";
const ROUTE = "/audit-results";

export const metadata: Metadata = {
  title: "Your AI Visibility Audit | 6Signal",
  description:
    "Your AI Visibility Audit — 8 slides covering buyer journey, signal scores, citation landscape, content gaps, and a 90-day action roadmap.",
  openGraph: {
    title: "Your AI Visibility Audit | 6Signal",
    description: "Your 8-slide AI Visibility Audit from 6Signal.",
    type: "website",
    url: `${BASE}${ROUTE}`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your AI Visibility Audit | 6Signal",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
  robots: { index: false, follow: false },
};

export default function AuditResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
