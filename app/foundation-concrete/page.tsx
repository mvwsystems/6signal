import type { Metadata } from "next";
import TradePage from "../components/TradePage";
import { tradesBySlug } from "../trades/data";

const data = tradesBySlug["foundation-concrete"];

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  openGraph: {
    title: data.ogTitle,
    description: data.ogDescription,
    type: "website",
    images: [{ url: "/og-social.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-social.jpg"],
  },
};

export default function FoundationConcretePage() {
  return <TradePage data={data} />;
}
