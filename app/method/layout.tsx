import type { Metadata } from "next";
import { BASE, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/method";
const TITLE = "The Method — Six Signals That Decide Which Contractor AI Recommends";
const DESC =
  "The 6 Signal framework in full: GEO, AEO, LEO, VEO, PEO, and IEO. How ChatGPT, Google AI Overviews, Maps, and voice assistants build a contractor shortlist, and the order the work gets done.";

export const metadata: Metadata = {
  title: "The Method — Six Signals That Decide Which Contractor AI Recommends",
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: { title: `${TITLE} | 6 Signal`, description: DESC, url: `${BASE}${ROUTE}`, type: "website" },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "The Method"),
);

export default function MethodLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
