import type { Metadata } from "next";
import CommercialPage from "../components/CommercialPage";

// NOTE: trades/data.ts also has a "commercial-contractors" entry kept for reference,
// but CommercialPage uses its own component and this file controls all metadata.
const canonical = "https://6signal.co/commercial-contractors";

export const metadata: Metadata = {
  title: "6Signal: AI Visibility Audit for Commercial Contractors",
  description:
    "AI visibility audits for commercial contractors in Dallas/Fort Worth and North Texas. See where your company appears across AI and search.",
  alternates: { canonical },
  openGraph: {
    title: "If project owners cannot verify you, they move on.",
    description:
      "Commercial contractors are evaluated before outreach. 6Signal builds the credibility infrastructure that survives buyer due diligence — and puts your company on bid lists you didn't know existed.",
    type: "website",
    url: canonical,
    images: [
      {
        url: "/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "6Signal visibility audit for commercial contractors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-social.jpg"],
  },
};

export default function CommercialContractorsPage() {
  return <CommercialPage />;
}
