import type { Metadata } from "next";
import TradePage from "../components/TradePage";
import { tradesBySlug } from "../trades/data";

const data = tradesBySlug["garage-doors"];

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  openGraph: {
    title: data.ogTitle,
    description: data.ogDescription,
    type: "website",
    images: [{ url: "/6SIGNAL.png" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/6SIGNAL.png"],
  },
};

export default function GarageDoorsPage() {
  return <TradePage data={data} />;
}
