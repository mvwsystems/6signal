import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Systemize — AI Infrastructure for Contractor Operations | 6Signal",
  description:
    "Custom AI infrastructure for the business behind the business — bookkeeping automation, field-to-office communication, fleet and job tracking, estimating support. Scoped per operation, built and run by one operator.",
  openGraph: {
    title: "Systemize — AI Infrastructure for Contractor Operations | 6Signal",
    description:
      "Run the operation on systems, not willpower. Custom AI infrastructure integrated with the tools you already run.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
};

export default function SystemizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
