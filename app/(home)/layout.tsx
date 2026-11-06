import type { Metadata } from "next";
import { BASE, ORG_ID, faqNode, graph, webPageNode } from "../lib/site";
import { HOME_FAQS } from "./faqs";

// The homepage is a client component and cannot export metadata, so the
// route group's layout carries its canonical and page-level JSON-LD.
const TITLE = "6 Signal — AI Visibility for Contractors in Dallas–Fort Worth";
const DESC =
  "Homeowners ask ChatGPT, Maps, and AI Overviews before they call. 6 Signal gets residential and commercial contractors named across six visibility signals — GEO, AEO, LEO, VEO, PEO, IEO. One operator, one contractor per market per trade. Based in Dallas–Fort Worth.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${BASE}/` },
  openGraph: { title: TITLE, description: DESC, url: `${BASE}/`, type: "website" },
};

const schema = graph(
  webPageNode("/", TITLE, DESC, { mainEntity: { "@id": ORG_ID } }),
  {
    "@type": "Product",
    "@id": `${BASE}/visibility-check#product`,
    name: "AI Visibility Audit",
    description:
      "An instant, self-serve audit that shows a contractor whether AI systems name their business when local buyers ask who to call — scored across six signals, with a ranked fix list.",
    brand: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "27",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${BASE}/visibility-check`,
      seller: { "@id": ORG_ID },
    },
  },
  faqNode("/", HOME_FAQS),
);

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
