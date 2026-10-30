// ─────────────────────────────────────────────────────────────────────────────
// SITE ENTITY — the one place 6 Signal describes itself to machines.
//
// Every JSON-LD block on the site references these constants by @id instead of
// re-declaring the organization. One name, one logo, one set of profile URLs,
// one service area — so Google, Bing, and the AI engines consolidate every
// page into a single entity instead of three ("6 Signal", "6Signal", "SIXSIGNAL").
//
// Fill in the GBP-sourced fields (locality, phone, canonical Maps URL) and the
// change propagates to every page on the next deploy.
// ─────────────────────────────────────────────────────────────────────────────

export const BASE = "https://6signal.co";

export const ORG_ID = `${BASE}/#organization`;
export const PERSON_ID = `${BASE}/#matt-vincent-walker`;
export const WEBSITE_ID = `${BASE}/#website`;

export const SITE_NAME = "6 Signal";
export const SITE_ALT_NAMES = ["6Signal", "SIXSIGNAL", "Six Signal"];
export const SITE_TAGLINE = "Be the contractor AI recommends.";
export const SITE_EMAIL = "hello@6signal.co";

// Absolute URLs — schema consumers do not resolve relative paths.
export const LOGO_URL = `${BASE}/6SIGDashboardLogo.png`;
export const SOCIAL_IMAGE_URL = `${BASE}/6SIG_SOCIAL_SHARE.png`;

// ── Google Business Profile ──────────────────────────────────────────────────
// The share link the owner holds. Replace with the canonical Maps URL
// (https://maps.google.com/?cid=…) once copied from the GBP dashboard so the
// sameAs edge resolves to the listing itself.
export const GBP_URL =
  "https://www.google.com/searchviewer/10?svid=CAwSHRIbCgNwdnESFENnMHZaeTh4TVhwNlpGOXphR2d3GAo";

// Must match the GBP exactly. Locality and phone are intentionally null until
// read off the profile — a wrong value is worse for entity trust than none.
export const ADDRESS_LOCALITY: string | null = null; // e.g. "Fort Worth"
export const ADDRESS_REGION = "TX";
export const ADDRESS_COUNTRY = "US";
export const PHONE: string | null = null; // e.g. "+1-817-555-0100"

// ── Operator ─────────────────────────────────────────────────────────────────
export const OPERATOR_NAME = "Matt Vincent Walker";
export const OPERATOR_URL = "https://mattvincentwalker.com";
export const OPERATOR_JOB_TITLE = "Founder & Operator";

// Profile URLs as published on mattvincentwalker.com (verified 2026-10-26).
// The LinkedIn slug there is /in/mattvwalker — the /in/mattvincentwalker URL
// the site previously used does not match the owner's personal site.
export const OPERATOR_SAME_AS = [
  OPERATOR_URL,
  "https://www.linkedin.com/in/mattvwalker/",
  "https://www.youtube.com/@MattVincentWalker",
  "https://x.com/mvwalker",
  "https://www.instagram.com/mattvincentwalker/",
  "https://www.tiktok.com/@mattvincentwalker",
];

// Organization profiles. Add the LinkedIn company page, Bing Places, Apple
// Business Connect, and directory listings here as they are created.
export const ORG_SAME_AS = [GBP_URL, OPERATOR_URL];

// ── Service area ─────────────────────────────────────────────────────────────
export const SERVICE_AREA_NAME = "Dallas–Fort Worth, Texas";

export const DFW_CITIES = [
  "Dallas",
  "Fort Worth",
  "Arlington",
  "Plano",
  "Irving",
  "Garland",
  "Frisco",
  "McKinney",
  "Denton",
  "Grand Prairie",
  "Mesquite",
  "Carrollton",
  "Richardson",
  "Lewisville",
  "Allen",
  "Flower Mound",
  "Mansfield",
  "Southlake",
  "Keller",
  "Grapevine",
  "Burleson",
  "Rockwall",
  "Waxahachie",
  "Red Oak",
  "Weatherford",
];

export const TRADES_SERVED = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electrical",
  "Remodeling",
  "Garage doors",
  "Landscaping",
  "Tree service",
  "Pest control",
  "Foundation and concrete",
  "Commercial general contracting",
];

export const KNOWS_ABOUT = [
  "AI visibility",
  "Generative Engine Optimization (GEO)",
  "Answer Engine Optimization (AEO)",
  "Local Entity Optimization (LEO)",
  "Voice Engine Optimization (VEO)",
  "Prompt Engine Optimization (PEO)",
  "Index Engine Optimization (IEO)",
  "Google Business Profile optimization",
  "Local SEO for contractors",
  "Structured data and schema markup",
  "AI infrastructure for construction companies",
];

export const ORG_DESCRIPTION =
  "6 Signal is an AI visibility practice for residential and commercial contractors. One operator, one contractor per market per trade. The practice measures and improves whether ChatGPT, Gemini, Perplexity, Google AI Overviews, Google Maps, and voice assistants name a contractor when local buyers ask who to call — across six signals: GEO, AEO, LEO, VEO, PEO, and IEO. Based in Dallas–Fort Worth, Texas.";

// ── Schema builders ──────────────────────────────────────────────────────────

function postalAddress() {
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressRegion: ADDRESS_REGION,
    addressCountry: ADDRESS_COUNTRY,
  };
  if (ADDRESS_LOCALITY) address.addressLocality = ADDRESS_LOCALITY;
  return address;
}

function areaServed() {
  return [
    { "@type": "AdministrativeArea", name: SERVICE_AREA_NAME },
    ...DFW_CITIES.map((city) => ({
      "@type": "City",
      name: city,
      containedInPlace: { "@type": "State", name: "Texas" },
    })),
  ];
}

/** The organization node. Referenced everywhere else by `{ "@id": ORG_ID }`. */
export function organizationNode() {
  const node: Record<string, unknown> = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    legalName: SITE_NAME,
    url: BASE,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 414, height: 299 },
    image: SOCIAL_IMAGE_URL,
    description: ORG_DESCRIPTION,
    slogan: SITE_TAGLINE,
    email: SITE_EMAIL,
    address: postalAddress(),
    areaServed: areaServed(),
    founder: { "@id": PERSON_ID },
    employee: { "@id": PERSON_ID },
    numberOfEmployees: { "@type": "QuantitativeValue", value: 1 },
    knowsAbout: KNOWS_ABOUT,
    sameAs: ORG_SAME_AS,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: SITE_EMAIL,
      areaServed: "US",
      availableLanguage: "English",
    },
    priceRange: "$27–$1,500/month",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "6 Signal services",
      itemListElement: [
        {
          "@type": "Offer",
          name: "AI Visibility Audit",
          price: "27",
          priceCurrency: "USD",
          url: `${BASE}/visibility-check`,
          itemOffered: {
            "@type": "Service",
            name: "AI Visibility Audit",
            serviceType: "AI visibility audit",
            description:
              "Instant, self-serve audit scoring a contractor across six signals (GEO, AEO, LEO, VEO, PEO, IEO) with a ranked fix list.",
          },
        },
        {
          "@type": "Offer",
          name: "Strategy Brief",
          price: "97",
          priceCurrency: "USD",
          url: `${BASE}/strategy-brief`,
          itemOffered: { "@type": "Service", name: "Strategy Brief", serviceType: "AI visibility implementation plan" },
        },
        {
          "@type": "Offer",
          name: "Strategy Call",
          price: "197",
          priceCurrency: "USD",
          url: `${BASE}/strategy-call`,
          itemOffered: { "@type": "Service", name: "Strategy Call", serviceType: "AI visibility consultation" },
        },
        {
          "@type": "Offer",
          name: "Contractor Website Rebuild",
          price: "1500",
          priceCurrency: "USD",
          url: `${BASE}/websites`,
          itemOffered: { "@type": "Service", name: "Contractor Website Rebuild", serviceType: "Website design and development" },
        },
        {
          "@type": "Offer",
          name: "Website Care Plan",
          price: "97",
          priceCurrency: "USD",
          url: `${BASE}/care`,
          itemOffered: { "@type": "Service", name: "Website Care Plan", serviceType: "Website hosting and maintenance" },
        },
      ],
    },
  };
  if (PHONE) {
    node.telephone = PHONE;
    (node.contactPoint as Record<string, unknown>).telephone = PHONE;
  }
  return node;
}

/** The operator node. Referenced by `{ "@id": PERSON_ID }`. */
export function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: OPERATOR_NAME,
    url: OPERATOR_URL,
    jobTitle: OPERATOR_JOB_TITLE,
    worksFor: { "@id": ORG_ID },
    knowsAbout: KNOWS_ABOUT,
    sameAs: OPERATOR_SAME_AS,
    homeLocation: { "@type": "Place", name: SERVICE_AREA_NAME },
  };
}

/** The site node. */
export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BASE,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    description: ORG_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

/** A WebPage node for a route. Pass `extra` for page-type overrides. */
export function webPageNode(
  route: string,
  name: string,
  description: string,
  extra: Record<string, unknown> = {},
) {
  return {
    "@type": "WebPage",
    "@id": `${BASE}${route}#webpage`,
    url: `${BASE}${route}`,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
    ...extra,
  };
}

/** BreadcrumbList for a route under Home. */
export function breadcrumbNode(route: string, name: string, parent?: { route: string; name: string }) {
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: BASE }];
  if (parent) {
    items.push({ "@type": "ListItem", position: 2, name: parent.name, item: `${BASE}${parent.route}` });
  }
  items.push({ "@type": "ListItem", position: items.length + 1, name, item: `${BASE}${route}` });
  return { "@type": "BreadcrumbList", "@id": `${BASE}${route}#breadcrumb`, itemListElement: items };
}

/** FAQPage from q/a pairs. */
export function faqNode(route: string, faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    "@id": `${BASE}${route}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Wrap nodes in a @graph document. */
export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
