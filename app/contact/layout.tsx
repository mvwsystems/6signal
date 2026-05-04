import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book the Visibility Audit — 6 Signal",
  description:
    "Book a free 30-minute contractor visibility audit. We run your company through all six layers — AI tools, Maps, voice, answer engines, and directories — live on the call. Based in the Dallas/Fort Worth area, working with contractors in DFW and select markets beyond Texas.",
  openGraph: {
    title: "Book the Visibility Audit — 6 Signal",
    description:
      "Thirty minutes. We show you exactly where your company appears across all six visibility layers — and where competitors are filling the gap. Yours to keep regardless.",
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book the Visibility Audit — 6 Signal",
    images: ["/6SIGNAL.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
