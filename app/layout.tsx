import type { Metadata } from "next";
import "./globals.css";
import MetaPixel from "./components/MetaPixel";
import Plausible from "./components/Plausible";
import Attribution from "./components/Attribution";
import { BASE, SITE_NAME, graph, organizationNode, personNode, websiteNode } from "./lib/site";

// Title template: child pages export a bare title ("The Method") and this
// appends the brand. A page that must own the whole string uses
// `title: { absolute: "..." }`. Never set `alternates.canonical` here — child
// routes without their own canonical would inherit "/" and tell Google every
// page is a duplicate of the homepage.
export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "6 Signal — AI Visibility for Contractors in Dallas–Fort Worth",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Homeowners ask ChatGPT, Maps, and AI Overviews before they call. 6 Signal gets residential and commercial contractors named across six visibility signals — GEO, AEO, LEO, VEO, PEO, IEO. One operator, based in Dallas–Fort Worth, serving DFW and select markets beyond Texas.",
  applicationName: SITE_NAME,
  authors: [{ name: "Matt Vincent Walker", url: "https://mattvincentwalker.com" }],
  creator: "Matt Vincent Walker",
  publisher: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_US",
    title: "6 Signal — AI Visibility for Contractors in Dallas–Fort Worth",
    description:
      "Homeowners ask ChatGPT, Maps, and AI Overviews before they call anyone. 6 Signal gets contractors onto that shortlist. One operator, based in Dallas–Fort Worth.",
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "6 Signal — AI Visibility for Contractors in Dallas–Fort Worth",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

// Entity graph on every page. Organization, operator, and site share stable
// @ids so each page's own JSON-LD (Article, Service, FAQPage…) links back to
// one entity instead of re-declaring it. Definitions live in app/lib/site.ts.
const ENTITY_GRAPH = graph(organizationNode(), personNode(), websiteNode());

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ENTITY_GRAPH) }}
        />
      </head>
      <body>
        <MetaPixel />
        <Plausible />
        <Attribution />
        {children}
      </body>
    </html>
  );
}
