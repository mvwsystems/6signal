import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reach the Operator | 6Signal",
  description:
    "Tell us where you are on the climb — Start, Stabilize, Scale, or Systemize. Goes directly to the operator; same-day reply.",
  openGraph: {
    title: "Reach the Operator | 6Signal",
    description:
      "Tell us where you are on the climb. Goes directly to the operator; same-day reply.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
};

export default function InquireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
