import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Your Website Build | 6Signal",
  description:
    "Answer a questionnaire built for your specific trade and your contractor website build begins — nothing to pay to get started. Live in 2–3 weeks.",
  openGraph: {
    title: "Start Your Website Build | 6Signal",
    description:
      "A questionnaire built for your trade, and a site that's live in 2–3 weeks.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
};

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
