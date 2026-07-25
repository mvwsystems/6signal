import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Climb — Start, Stabilize, Scale, Systemize | 6 Signal",
  description:
    "The four-rung practice map for contractor businesses: Start (brand + web), Stabilize (front-office AI), Scale (visibility-led growth), Systemize (AI infrastructure for internal ops). One operator, hands-on.",
  openGraph: {
    title: "The Climb — Start, Stabilize, Scale, Systemize | 6 Signal",
    description:
      "The four-rung practice map for contractor businesses: Start (brand + web), Stabilize (front-office AI), Scale (visibility-led growth), Systemize (AI infrastructure for internal ops). One operator, hands-on.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Climb — Start, Stabilize, Scale, Systemize | 6 Signal",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
};

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
