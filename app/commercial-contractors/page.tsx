import type { Metadata } from "next";
import CommercialPage from "../components/CommercialPage";

export const metadata: Metadata = {
  title: "6 Signal for Commercial Contractors — Build the Credibility Infrastructure That Wins Bids",
  description:
    "Commercial buyers verify contractors before outreach. GCs, procurement teams, and project owners research through AI and search before sending RFPs. 6 Signal builds the credibility infrastructure that survives that scrutiny. Based in Dallas/Fort Worth, serving commercial contractors in DFW and select markets. Free 30-minute audit.",
  openGraph: {
    title: "If project owners cannot verify you, they move on.",
    description:
      "Commercial contractors are evaluated before outreach. 6 Signal builds the credibility infrastructure that survives buyer due diligence — and puts your company on bid lists you didn't know existed.",
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/6SIGNAL.png"],
  },
};

export default function CommercialContractorsPage() {
  return <CommercialPage />;
}
