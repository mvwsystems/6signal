import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BlogPageClient from "../../components/BlogPageClient";
import ConstructionSoftwareCatalog from "../../components/ConstructionSoftwareCatalog";
import {
  CONSTRUCTION_SOFTWARE,
  SOFTWARE_CATEGORIES,
  CATEGORY_NOTES,
  DISCOVERY_DIRECTORIES,
  CATALOG_UPDATED,
  CATALOG_UPDATED_ISO,
  categorySlug,
} from "../../data/constructionSoftware";
import { BASE, ORG_ID } from "../../lib/site";

const ROUTE = "/research/construction-software";
const URL = `${BASE}${ROUTE}`;

const TOTAL = CONSTRUCTION_SOFTWARE.length;
const VENDOR_AI = CONSTRUCTION_SOFTWARE.filter((p) => p.aiStatus === "vendor").length;
const UNVERIFIED_AI = TOTAL - VENDOR_AI;
const CATEGORY_COUNT = SOFTWARE_CATEGORIES.length;

const DESCRIPTION = `A sourced catalog of ${TOTAL} construction and trade software products — field service, construction management, estimating, ERP, safety, BIM and more — with what each does, who it is built for, and what the vendor says its AI does.`;

export const metadata: Metadata = {
  title: "The Construction Software Catalog | Contractor Software and AI Features",
  description: DESCRIPTION,
  openGraph: {
    title: "The Construction Software Catalog | 6 Signal",
    description: DESCRIPTION,
    type: "website",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "The Construction Software Catalog | 6 Signal",
    description: DESCRIPTION,
  },
  alternates: { canonical: URL },
};

const ARROW = (
  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M0 5h14M10 1l4 4-4 4" />
  </svg>
);

const CRITERIA = [
  "The workflow it runs — dispatch, project records, estimating, accounting — before the brand",
  "Fit for your contractor type: home service, residential, commercial or heavy civil",
  "Fit for your size: solo operator, 5–50 technicians, or a multi-office enterprise",
  "Whether the AI feature is released, in beta, in preview or on a roadmap",
  "Which plan, tier or paid add-on the AI feature requires",
  "Native AI versus a connector to an outside assistant such as ChatGPT or Claude",
  "Whether the AI drafts for human review or acts on its own",
  "Integration with your accounting and payroll system",
  "Mobile and offline use for crews in the field",
  "Regional availability and where your data is stored",
  "Data export if you ever leave",
  "Who inside the company will own the system after go-live",
];

const NOT_YET = [
  "Nobody can describe the current workflow end to end",
  "The tool you already pay for is mostly unused",
  "Job, customer and cost data live in spreadsheets nobody reconciles",
  "No one inside the company will own the system after launch",
  "The reason for switching is a single AI feature in a demo",
  "You cannot name the workflow that costs you the most money",
];

const READY = [
  "The workflow is written down and the gap is specific",
  "You have outgrown the spreadsheet or the starter app",
  "One person owns adoption and data quality",
  "You know which plan includes the features you need",
  "You can measure the before — hours, errors, days to invoice",
  "The new system connects to accounting instead of replacing it blind",
];

export default function ConstructionSoftwarePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Research", item: `${BASE}/research` },
      { "@type": "ListItem", position: 3, name: "Construction Software Catalog", item: URL },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Construction Software Catalog",
    description: DESCRIPTION,
    url: URL,
    dateModified: CATALOG_UPDATED_ISO,
    publisher: { "@id": ORG_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: TOTAL,
      itemListElement: CONSTRUCTION_SOFTWARE.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: p.sources[0]?.url,
      })),
    },
  };

  const countFor = (cat: string) =>
    CONSTRUCTION_SOFTWARE.filter((p) => p.category === cat).length;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <header className="tindex-hero">
        <div className="wrap">
          <div className="tindex-hero-inner">
            <div className="tindex-label">
              <span className="tindex-label-dot" aria-hidden="true" />
              <span className="idx">Market Map · Operations</span>
            </div>
            <h1 className="display tindex-h1">
              The Construction<br />
              <em>Software Catalog</em>
            </h1>
            <p className="tindex-sub">
              {TOTAL} construction and trade software products across {CATEGORY_COUNT}{" "}
              workflows — what each one does, who it is built for, and what the vendor says
              its AI does. Home service to heavy civil.
            </p>
            <div className="tindex-meta-row">
              <span>Updated {CATALOG_UPDATED}</span>
              <span className="tindex-meta-sep">·</span>
              <span>{TOTAL} products</span>
              <span className="tindex-meta-sep">·</span>
              <span>{CATEGORY_COUNT} categories</span>
              <span className="tindex-meta-sep">·</span>
              <span>Sourced</span>
            </div>
            <div className="tindex-cta-row">
              <a href="#catalog" className="btn btn-primary">
                Browse the catalog
                {ARROW}
              </a>
              <Link href="/systemize" className="btn btn-ghost">
                Connect the stack
                {ARROW}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── EXECUTIVE SUMMARY ────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Executive Summary</span>
            </div>
            <h2 className="tindex-h2">Pick the workflow first.<br /><em>Then the software.</em></h2>
          </div>
          <div className="tindex-body">
            <p>
              Contractor software is not one market. A dispatch board for a six-truck HVAC
              shop, a takeoff tool for a drywall estimator, a construction ERP for a
              general contractor and a drone-capture platform for a solar developer all get
              called &ldquo;construction software.&rdquo; This catalog sorts {TOTAL} products
              by the primary workflow they run, so products in different categories are
              not automatically competitors.
            </p>
            <p>
              Almost every vendor now describes some form of AI. Of the {TOTAL} products
              here, {VENDOR_AI} have vendor-described AI and {UNVERIFIED_AI} did not have
              product-specific AI verified in the research. The descriptions range widely —
              from released features, to beta and preview programs, to paid add-ons, to
              roadmap language with a target quarter. Each entry states which.
            </p>
            <p>
              Every description is drawn from the vendor&rsquo;s own pages, linked under
              each entry. None of it is hands-on testing or independent performance
              validation. Plans, modules, rollout stages and regional availability change;
              confirm with the vendor before you buy.
            </p>
          </div>

          <div className="tindex-pov">
            <span className="tindex-pov-label">6Signal POV</span>
            <p className="tindex-pov-text">An AI feature is not a reason to switch systems.</p>
            <p className="tindex-pov-text">
              Most of the AI described in this catalog drafts, extracts, counts or answers
              questions inside one product. The leverage in a contracting business is
              usually between products — the job that moves from the phone call to the
              estimate to the schedule to the invoice without being retyped.
            </p>
          </div>
        </div>
      </section>

      {/* ── AI LEGEND ────────────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">How to Read the AI Status</span>
            </div>
            <h2 className="tindex-h2">Two labels.<br />Neither is a rating.</h2>
          </div>
          <div className="tindex-rec-grid">
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">
                Vendor-described AI · {VENDOR_AI} products
              </span>
              <p className="tindex-rec-body">
                A vendor describes an AI-related capability, a named integration, a separate
                AI offering or a forthcoming feature connected to the product. The entry
                states which. It is not an independent performance validation or an
                assurance that the feature is available on your plan today.
              </p>
            </div>
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">
                AI not verified · {UNVERIFIED_AI} products
              </span>
              <p className="tindex-rec-body">
                The research did not verify product-specific AI. It does not mean the
                product lacks AI. In several cases a separate product or integration from
                the same vendor carries the AI, and the entry names it rather than
                crediting it to the core product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Categories</span>
            </div>
            <h2 className="tindex-h2">{CATEGORY_COUNT} workflows.<br /><em>Not one market.</em></h2>
          </div>
          <div className="tindex-cat-grid csw-cat-grid">
            {SOFTWARE_CATEGORIES.map((cat, i) => (
              <a className="tindex-cat-card csw-cat-card" key={cat} href={`#c-${categorySlug(cat)}`}>
                <span className="tindex-cat-num">
                  {String(i + 1).padStart(2, "0")}
                  <span className="csw-cat-count"> · {countFor(cat)} {countFor(cat) === 1 ? "product" : "products"}</span>
                </span>
                <div className="tindex-cat-name">{cat}</div>
                <p className="csw-cat-note">{CATEGORY_NOTES[cat]}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATALOG ──────────────────────────────────────────────────── */}
      <section className="tindex-section rule" id="catalog">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">The Catalog</span>
            </div>
            <h2 className="tindex-h2">All {TOTAL} products</h2>
          </div>
          <p className="tindex-body tindex-body-narrow">
            Filter by workflow, trade or AI status. Open any entry for what it is used for,
            who it is built for, the AI detail, plan and availability notes, and the vendor
            sources behind each statement.
          </p>
          <ConstructionSoftwareCatalog />
        </div>
      </section>

      {/* ── WHAT THE AI ACTUALLY DOES ────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">6Signal Assessment</span>
            </div>
            <h2 className="tindex-h2">What the AI in this<br />software actually does</h2>
          </div>
          <div className="tindex-body">
            <p>
              Read across the {VENDOR_AI} vendor-described entries and the AI falls into a
              handful of jobs. It drafts — estimates, RFIs, quotes, homeowner updates,
              customer messages. It extracts — supplier invoices, receipts, equipment
              nameplates, safety data sheets. It counts and measures — symbols, rooms,
              walls and areas on a plan sheet. It answers questions about the data already
              inside the product. And in field service, it answers the phone and books the
              job.
            </p>
            <p>
              Most of it is framed as a first pass for a person to review, not a decision
              the software makes. That is the right framing for an estimate or a submittal.
              It also means the hours saved depend on someone checking the output, every
              time.
            </p>
            <p>
              The gating matters as much as the feature. Many AI capabilities sit on a
              specific tier, behind a paid add-on, in beta or preview, or on a roadmap with
              a target date. A few are integrations that connect the product to an outside
              assistant rather than AI built into the product. The notes on each entry say
              which — read them before a demo, not after a contract.
            </p>
            <p>
              None of these products, on its own, connects the phone call to the estimate
              to the schedule to the invoice. That connective layer is where most
              contractors lose time and money. It is the subject of{" "}
              <Link href="/research/intelligent-contractor" className="tindex-inline-link">
                The Intelligent Contractor
              </Link>{" "}
              series.
            </p>
          </div>
        </div>
      </section>

      {/* ── BEFORE YOU BUY ───────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Buyer Framework</span>
            </div>
            <h2 className="tindex-h2">How to evaluate<br />contractor software</h2>
          </div>
          <div className="tindex-body">
            <p>
              Weigh these before a demo. Which ones matter most depends on your trade,
              your size and how much of the current process is written down.
            </p>
          </div>
          <div className="tindex-criteria">
            {CRITERIA.map((c) => (
              <div className="tindex-criterion" key={c}>
                <div className="tindex-criterion-check" aria-hidden="true">
                  <span />
                </div>
                <p className="tindex-criterion-text">{c}</p>
              </div>
            ))}
          </div>
          <p className="tindex-tagline">
            Buy the workflow you will run every day, not the feature in the demo.
          </p>
        </div>
      </section>

      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-twin">
            <div>
              <div className="tindex-eyebrow">
                <span className="tindex-eyebrow-dot" aria-hidden="true" />
                <span className="idx">Fix These First</span>
              </div>
              <h2 className="tindex-h2" style={{ fontSize: "clamp(24px,2.4vw,36px)", marginBottom: 24 }}>
                When new software<br />will not help yet
              </h2>
              <div className="tindex-check-list">
                {NOT_YET.map((item) => (
                  <div className="tindex-check-item" key={item}>
                    <svg className="tindex-check-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" stroke="rgba(255,255,255,0.15)" />
                      <path d="M6 10l3 3 5-6" stroke="#555553" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="tindex-check-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="tindex-eyebrow">
                <span className="tindex-eyebrow-dot" aria-hidden="true" />
                <span className="idx">Ready to Buy When</span>
              </div>
              <h2 className="tindex-h2" style={{ fontSize: "clamp(24px,2.4vw,36px)", marginBottom: 24 }}>
                When a new system<br />actually makes sense
              </h2>
              <div className="tindex-check-list">
                {READY.map((item) => (
                  <div className="tindex-check-item" key={item}>
                    <svg className="tindex-check-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" stroke="rgba(230,255,0,0.3)" />
                      <path d="M6 10l3 3 5-6" stroke="#E6FF00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="tindex-check-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHERE TO FIND MORE ───────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Where to Find More</span>
            </div>
            <h2 className="tindex-h2">Discovery directories</h2>
          </div>
          <div className="tindex-body">
            <p>
              This catalog is selective, not a complete registry. These directories are
              useful for discovery. They are not independent verification — listings,
              rankings, reviews, sponsorships and availability change, and several include
              paid placement.
            </p>
          </div>
          <div className="tindex-table-wrap">
            <table className="tindex-table">
              <thead>
                <tr>
                  <th>Directory</th>
                  <th>Scope and limitations</th>
                </tr>
              </thead>
              <tbody>
                {DISCOVERY_DIRECTORIES.map((d) => (
                  <tr key={d.url}>
                    <td className="t-name">
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="csw-dir-link">
                        {d.name}
                      </a>
                    </td>
                    <td style={{ minWidth: 360 }}>{d.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tindex-disclaimer">
            Product descriptions and capabilities are based on linked sources, mostly vendor
            descriptions, and were not hands-on tested. Research compiled {CATALOG_UPDATED}.
            Submit corrections via{" "}
            <Link href="/contact" className="tindex-inline-link">
              /contact
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── SUBMIT ───────────────────────────────────────────────────── */}
      <section className="tindex-submit rule">
        <div className="wrap">
          <div className="tindex-submit-inner">
            <div>
              <h2 className="tindex-submit-h">Building software for contractors?</h2>
              <p className="tindex-submit-body">
                Send it to 6Signal for review, or send a correction to an existing entry.
                Include a link to the vendor page that supports each claim. No guaranteed
                placement.
              </p>
            </div>
            <Link href="/contact" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>
              Submit a Product
              {ARROW}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="tindex-section rule" style={{ paddingBottom: 160 }}>
        <div className="wrap">
          <div className="tindex-final-cta">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Systemize</span>
            </div>
            <h2 className="display tindex-final-h2">
              The software is the tool.<br />
              <em>The system is the work.</em>
            </h2>
            <p className="tindex-sub" style={{ marginBottom: 40, maxWidth: 600 }}>
              6 Signal builds the AI layer that connects the software a contractor already
              runs — estimating, field-to-office, job tracking, back office — so work
              moves between systems without being retyped.
            </p>
            <div className="tindex-cta-row">
              <Link href="/systemize" className="btn btn-primary btn-lg">
                See Systemize
                {ARROW}
              </Link>
              <Link href="/book" className="btn btn-ghost btn-lg">
                Book an appointment
                {ARROW}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
