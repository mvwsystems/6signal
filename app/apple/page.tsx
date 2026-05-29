import type { Metadata } from "next";
import AppleMapsReadinessPage from "../components/AppleMapsReadinessPage";

const canonical = "https://6signal.co/apple";

export const metadata: Metadata = {
  title: "Apple Maps Readiness Setup for Contractors | 6Signal",
  description:
    "Apple Maps is becoming a local ad platform. 6Signal claims, cleans up, and optimizes your Apple Business Connect profile so contractors and local service businesses are ready before Apple Maps Ads get crowded. $750 one-time setup.",
  alternates: { canonical },
  openGraph: {
    title: "Apple Maps is becoming a local ad platform. Get found before it gets crowded.",
    description:
      "6Signal helps contractors and local service businesses claim, clean up, and optimize their Apple Maps presence so they're ready for the next wave of local search.",
    type: "website",
    url: canonical,
    images: [
      {
        url: "/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "Apple Maps Readiness Setup for contractors — 6Signal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apple Maps is becoming a local ad platform. Get found before it gets crowded.",
    images: ["/og-social.jpg"],
  },
};

export default function Page() {
  return <AppleMapsReadinessPage />;
}
