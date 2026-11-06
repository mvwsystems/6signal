import type { Metadata } from "next";
import { BASE, ORG_ID, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/follow-up";
const TITLE = "AI Follow-Up Layer — Missed Calls, Forms, and Texts Answered in Seconds";
const DESC =
  "The first contractor to respond usually wins the job. The AI Follow-Up Layer handles missed calls, form submissions, and text inquiries automatically so the leads you already paid for stop going to faster competitors.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: { title: `${TITLE} | 6 Signal`, description: DESC, url: `${BASE}${ROUTE}`, type: "website" },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Follow-Up"),
  {
    "@type": "Service",
    "@id": `${BASE}${ROUTE}#service`,
    name: "AI Follow-Up Layer",
    serviceType: "Lead response automation for contractors",
    provider: { "@id": ORG_ID },
  },
);

export default function FollowUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
