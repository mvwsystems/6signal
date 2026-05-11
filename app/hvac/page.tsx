import type { Metadata } from "next";
import TradePage from "../components/TradePage";
import { tradesBySlug } from "../trades/data";

const data = tradesBySlug["hvac"];
const canonical = `https://6signal.co/${data.slug}`;

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical },
  openGraph: {
    title: data.ogTitle,
    description: data.ogDescription,
    type: "website",
    url: canonical,
    images: [
      {
        url: "/og-social.jpg",
        width: 1200,
        height: 630,
        alt: "6Signal visibility audit for HVAC companies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-social.jpg"],
  },
};

export default function HvacPage() {
  return <TradePage data={data} />;
}
