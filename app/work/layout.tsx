import type { Metadata } from "next";
import { BASE, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/work";
const TITLE = "The Work — Documented AI Visibility Results for Contractors";
const DESC =
  "What a 6 Signal engagement actually produces. X-Act Plumbing, Red Oak, TX: named in 92% of Gemini checks, 74% of ChatGPT checks, and 69% of Perplexity checks across 629 automated checks. Methodology, audit examples, and website builds.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: { title: `${TITLE} | 6 Signal`, description: DESC, url: `${BASE}${ROUTE}`, type: "website" },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Work"),
);

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
