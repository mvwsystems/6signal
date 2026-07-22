import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — 6 Signal",
  description:
    "Get the AI Visibility Audit or send a message. We run your company through all six layers — AI tools, Maps, voice, answer engines, and directories. Based in the Dallas/Fort Worth area, working with contractors in DFW and select markets beyond Texas.",
  openGraph: {
    title: "Contact — 6 Signal",
    description:
      "Get the AI Visibility Audit or reach out directly. We show you exactly where your company appears across all six visibility layers — and where competitors are filling the gap.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — 6 Signal",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
