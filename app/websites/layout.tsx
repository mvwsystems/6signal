import type { Metadata } from "next";
import { BASE, ORG_ID, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/websites";
const TITLE = "Contractor Website Rebuild — $1,500 Flat, Copy Written for You";
const DESC =
  "A professional contractor website for $1,500 flat. Copy written for you, built to be read by AI crawlers and Google, live in 2–3 weeks. Six real builds on the page. Dallas–Fort Worth and beyond.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: { title: `${TITLE} | 6 Signal`, description: DESC, url: `${BASE}${ROUTE}`, type: "website" },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Websites"),
  {
    "@type": "Service",
    "@id": `${BASE}${ROUTE}#service`,
    name: "Contractor Website Rebuild",
    serviceType: "Website design and development for contractors",
    provider: { "@id": ORG_ID },
    areaServed: "US",
    offers: { "@type": "Offer", price: "1500", priceCurrency: "USD", url: `${BASE}${ROUTE}` },
  },
);

export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
