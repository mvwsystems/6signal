import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stabilize — Front-Office AI for Contractors | 6Signal",
  description:
    "AI receptionist, missed-call text-back, email sorting, lead routing, and follow-up — front-end AI systems that catch the work your visibility earns. Built and run by one operator.",
  openGraph: {
    title: "Stabilize — Front-Office AI for Contractors | 6Signal",
    description:
      "Front-end AI systems that answer, book, sort, and follow up — so the phone your visibility rings actually converts.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
};

export default function StabilizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
