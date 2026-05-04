import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractor Visibility Audit — Six Layers, Live — 6 Signal",
  description:
    "The 6 Signal visibility audit examines your contractor company across six search and AI layers: generative AI, prompt engines, answer engines, indexing, local entity data, and voice. See exactly where you appear — and where competitors are showing up instead.",
  openGraph: {
    title: "Six systems decide who gets the call. Are you in all six?",
    description:
      "6 Signal audits contractor visibility across all six layers — AI recommendations, Maps, answer engines, voice, and directories — live on a 30-minute call. Free. Yours to keep.",
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Six systems decide who gets the call.",
    images: ["/6SIGNAL.png"],
  },
};

export default function VisibilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
