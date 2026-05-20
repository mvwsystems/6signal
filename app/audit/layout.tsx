import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Visibility Audit — 6 Signal",
  description:
    "See exactly where you appear across AI tools, Maps, voice search, answer engines, and directories — and where competitors are filling the gap. Free 30-minute audit.",
  openGraph: {
    title: "The Visibility Audit — 6 Signal",
    description:
      "See exactly where you appear across AI tools, Maps, voice search, answer engines, and directories — and where competitors are filling the gap.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "The Visibility Audit — 6 Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Visibility Audit — 6 Signal",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
