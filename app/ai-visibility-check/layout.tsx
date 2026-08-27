import type { Metadata } from "next";

const BASE = "https://6signal.co";
const ROUTE = "/ai-visibility-check";

export const metadata: Metadata = {
  title: "Free AI Visibility Check — Is Your Business Getting Found? | 6Signal",
  description:
    "Find out in 60 seconds if AI recommends your business or your competitor. Free instant check for contractors and local service businesses.",
  openGraph: {
    title: "Free AI Visibility Check — Is Your Business Getting Found? | 6Signal",
    description:
      "Find out in 60 seconds if AI recommends your business or your competitor. Free instant check for contractors and local service businesses.",
    type: "website",
    url: `${BASE}${ROUTE}`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Free AI Visibility Check — 6Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Visibility Check — Is Your Business Getting Found? | 6Signal",
    description:
      "Find out in 60 seconds if AI recommends your business or your competitor. Free instant check.",
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
      name: "The AI Visibility Shift | Get Found in AI Search | 6Signal",
      description:
        "Customers are asking AI who to call. 6Signal helps local businesses see whether they get found, skipped, or replaced across Google, AI search, Maps, voice, reviews, and directories.",
      isPartOf: { "@id": `${BASE}/#website` },
      publisher: { "@id": `${BASE}/#organization` },
      breadcrumb: { "@id": `${BASE}${ROUTE}/#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE}${ROUTE}/#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "AI Visibility Check", item: `${BASE}${ROUTE}` },
      ],
    },
  ],
};

export default function AIVisibilityCheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
