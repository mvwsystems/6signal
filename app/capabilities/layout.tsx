import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capabilities — 6 Signal",
  description:
    "Explore 6 Signal's broader contractor capabilities: visibility-ready websites, AI/search visibility, review systems, lead capture, automation, advisory, and experimental tools from 6 Signal Labs.",
  openGraph: {
    title: "Capabilities — 6 Signal",
    description:
      "Explore 6 Signal's broader contractor capabilities: visibility-ready websites, AI/search visibility, review systems, lead capture, automation, advisory, and experimental tools from 6 Signal Labs.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Get More HVAC, Plumbing, Roofing Leads — 6 Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Capabilities — 6 Signal",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
};

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
