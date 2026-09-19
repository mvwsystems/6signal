import type { Metadata } from "next";

const BASE = "https://6signal.co";
const ROUTE = "/profit-leak";
const TITLE = "The Contractor Profit Leak Audit — Free Field Guide | 6Signal";
const DESC =
  "Seven places general contractors lose money that never show up as a line item, and the one question that exposes each of them. Score the 21-question audit online or download the field guide.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    url: `${BASE}${ROUTE}`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "The Contractor Profit Leak Audit — 6Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Seven places general contractors lose money that never show up as a line item. Score the audit or download the guide.",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
  alternates: { canonical: `${BASE}${ROUTE}` },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "6Signal",
      url: BASE,
      logo: { "@type": "ImageObject", url: `${BASE}/6SIGDashboardLogo.png` },
      sameAs: [BASE],
    },
    {
      "@type": "WebPage",
      "@id": `${BASE}${ROUTE}/#webpage`,
      url: `${BASE}${ROUTE}`,
      name: TITLE,
      description: DESC,
      isPartOf: { "@id": `${BASE}/#website` },
      publisher: { "@id": `${BASE}/#organization` },
      breadcrumb: { "@id": `${BASE}${ROUTE}/#breadcrumb` },
    },
    {
      "@type": "DigitalDocument",
      "@id": `${BASE}${ROUTE}/#guide`,
      name: "Field Guide No. 01 — The Contractor Profit Leak Audit",
      description: DESC,
      url: `${BASE}/6signal-contractor-profit-leak-audit.pdf`,
      encodingFormat: "application/pdf",
      author: { "@type": "Person", name: "Matt Vincent Walker" },
      publisher: { "@id": `${BASE}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE}${ROUTE}/#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Profit Leak Audit", item: `${BASE}${ROUTE}` },
      ],
    },
  ],
};

export default function ProfitLeakLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
