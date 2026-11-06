import type { Metadata } from "next";
import { BASE, ORG_ID, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/care";
const TITLE = "Website Care Plan — $97/Month Hosting, Monitoring, and Updates";
const DESC =
  "Hosting, uptime monitoring, small content updates, and support for your contractor website — $97 a month, handled by the operator who built it. The ongoing half of the $1,500 website rebuild.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: { title: `${TITLE} | 6 Signal`, description: DESC, url: `${BASE}${ROUTE}`, type: "website" },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Care"),
  {
    "@type": "Service",
    "@id": `${BASE}${ROUTE}#service`,
    name: "Website Care Plan",
    serviceType: "Website hosting and maintenance",
    provider: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "97",
      priceCurrency: "USD",
      url: `${BASE}${ROUTE}`,
      priceSpecification: { "@type": "UnitPriceSpecification", price: "97", priceCurrency: "USD", billingDuration: "P1M" },
    },
  },
);

export default function CareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
