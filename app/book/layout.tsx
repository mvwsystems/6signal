import type { Metadata } from "next";
import { BASE, ORG_ID, OPERATOR_NAME, PERSON_ID, breadcrumbNode, graph, webPageNode } from "../lib/site";

const ROUTE = "/book";
const TITLE = "Book an Appointment";
const DESC =
  "Thirty minutes with Matt Vincent Walker — no charge. We walk through how work moves through your company today, where information gets retyped, lost, or late, and which system to connect first. Zoom, phone, or your office in Dallas–Fort Worth.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: {
    title: `${TITLE} | 6 Signal`,
    description:
      "Thirty minutes, no charge. Find the first seam worth closing — one operator, no pitch, no follow-up chase if it is not a fit.",
    url: `${BASE}${ROUTE}`,
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
};

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Book"),
  {
    // ReservationAction rather than an Offer: nothing is sold on this page, and
    // the scoping fee that may follow the call is quoted per engagement, never
    // published. The call itself is free, so price is an explicit zero.
    "@type": "ReserveAction",
    "@id": `${BASE}${ROUTE}#reserve`,
    name: "Book a 30-minute appointment with 6 Signal",
    target: `${BASE}${ROUTE}`,
    provider: { "@id": ORG_ID },
    agent: { "@id": PERSON_ID },
    description: `A 30-minute working conversation with ${OPERATOR_NAME}. No charge.`,
  },
);

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  );
}
