import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apple Maps Readiness Checklist | 6Signal",
  description:
    "A practical checklist for contractors and local service businesses preparing their Apple Business Connect profile before Apple Maps Ads reach their market.",
  alternates: { canonical: "https://6signal.co/apple-checklist" },
};

const sections = [
  {
    title: "1. Claim & Verify Your Listing",
    items: [
      "Sign in to Apple Business Connect at businessconnect.apple.com",
      "Search for your business and claim the existing record (or add it if it doesn't exist)",
      "Complete the verification process — Apple may verify by phone, email, or postcard",
      "Confirm your business appears correctly on Apple Maps after verification",
    ],
  },
  {
    title: "2. Business Information",
    items: [
      "Business name matches exactly what appears on your website and Google Business Profile",
      "Street address is correct and formatted consistently (no abbreviations vs. full words)",
      "Phone number matches your primary contact number across all platforms",
      "Website URL is correct and leads to your main site (not a directory page)",
      "Business hours are set correctly, including seasonal or holiday variations",
    ],
  },
  {
    title: "3. Categories & Services",
    items: [
      "Primary category accurately describes your main trade (e.g. Plumber, HVAC Contractor, Roofer)",
      "Additional categories added for secondary services where applicable",
      "Service area is defined if you serve customers at their location rather than a fixed address",
      "Service descriptions use plain language a customer would actually search for",
    ],
  },
  {
    title: "4. Photos & Visual Assets",
    items: [
      "Logo uploaded — clear, square format, legible at small sizes",
      "Cover image uploaded — shows your team, equipment, or a completed job (not a stock photo)",
      "At least 5 photos of real work uploaded (before/after, job sites, vehicles, team)",
      "Photos are high resolution and properly oriented",
      "No watermarks, text overlays, or promotional graphics on photos",
    ],
  },
  {
    title: "5. NAP Consistency Check",
    items: [
      "Business name is identical across Apple Maps, Google Business Profile, and your website",
      "Address is formatted the same way on all platforms",
      "Phone number is the same on all platforms — no tracking numbers that differ by source",
      "Website URL is consistent — no trailing slashes or www/non-www mismatches",
      "No duplicate Apple Business Connect listings for the same location",
    ],
  },
  {
    title: "6. Google Business Profile Alignment",
    items: [
      "Business name, address, and phone match your Google Business Profile exactly",
      "Primary category on Apple is equivalent to your Google primary category",
      "Hours match on both platforms",
      "Photos on Apple Maps represent the same quality level as your Google profile",
    ],
  },
  {
    title: "7. Apple Maps Ads Readiness",
    items: [
      "Profile is fully claimed and verified (required before running ads)",
      "All required fields are complete — no empty or placeholder information",
      "Landing page behind your website URL is mobile-optimized and loads quickly",
      "Phone number is actively monitored and answered during business hours",
      "A plan is in place to track calls and taps from Apple Maps (UTM parameters or call tracking)",
    ],
  },
  {
    title: "8. Ongoing Maintenance",
    items: [
      "Business hours updated whenever they change (holidays, closures)",
      "New photos added at least quarterly",
      "Respond to any customer reviews or questions that come through Apple Maps",
      "Check your listing every 90 days for auto-generated changes Apple may have applied",
    ],
  },
];

export default function AppleChecklistPage() {
  return (
    <div className="acl-page">
      {/* ── HEADER ── */}
      <header className="acl-header">
        <div className="acl-header-inner">
          <img src="/6SIG_LOGO_FINAL_2.webp" alt="6Signal" className="acl-logo" />
          <span className="acl-doc-type">Checklist</span>
        </div>
      </header>

      <main className="acl-main">
        {/* ── TITLE BLOCK ── */}
        <div className="acl-title-block">
          <div className="acl-eyebrow">6Signal · Apple Maps Readiness</div>
          <h1 className="acl-title">Apple Maps Readiness Checklist</h1>
          <p className="acl-subtitle">
            For contractors and local service businesses preparing their Apple Business Connect
            profile before Apple Maps Ads reach their market.
          </p>
          <div className="acl-meta">
            <span>6signal.co/apple-checklist</span>
            <span className="acl-meta-sep">·</span>
            <span>hello@6signal.co</span>
          </div>
        </div>

        {/* ── INTRO ── */}
        <div className="acl-intro">
          <p>
            Apple Maps is becoming a paid local discovery platform. Before that happens, your
            Apple Business Connect profile needs to be claimed, complete, and consistent. This
            checklist walks through every field and setting that determines whether your business
            appears correctly — and whether you&rsquo;ll be ready to run ads when the time comes.
          </p>
          <p>
            Work through each section in order. Most businesses can complete this in two to three
            hours. If you get stuck on verification or want a professional to handle it, see the
            note at the bottom of this document.
          </p>
        </div>

        {/* ── CHECKLIST SECTIONS ── */}
        {sections.map((section, si) => (
          <div className="acl-section" key={si}>
            <h2 className="acl-section-title">{section.title}</h2>
            <ul className="acl-list">
              {section.items.map((item, ii) => (
                <li className="acl-item" key={ii}>
                  <span className="acl-checkbox" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* ── CTA BLOCK ── */}
        <div className="acl-cta-block">
          <div className="acl-cta-rule" />
          <h2 className="acl-cta-title">Want help setting this up correctly?</h2>
          <p className="acl-cta-body">
            6Signal offers a done-for-you Apple Maps Readiness Setup — we claim, clean up,
            and optimize your Apple Business Connect profile so you don&rsquo;t have to figure
            out the details yourself. Book a 15-minute call to discuss your situation.
          </p>
          <div className="acl-cta-row">
            <a
              href="https://calendly.com/mvw-mattvincentwalker/ai-audit"
              className="acl-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Consult →
            </a>
            <Link href="/apple" className="acl-btn-secondary">
              See the Apple Maps Setup →
            </Link>
          </div>
          <p className="acl-cta-contact">
            Or email us at <a href="mailto:hello@6signal.co">hello@6signal.co</a>
          </p>
        </div>

        {/* ── FOOTER ── */}
        <div className="acl-footer">
          <div className="acl-footer-rule" />
          <div className="acl-footer-inner">
            <span>6signal.co · hello@6signal.co</span>
            <span className="acl-meta-sep">·</span>
            <span>Apple Maps Readiness Checklist</span>
          </div>
        </div>
      </main>

      <style>{`
        .acl-page {
          background: #ffffff;
          color: #111110;
          font-family: "Inter", system-ui, sans-serif;
          min-height: 100vh;
        }
        .acl-header {
          border-bottom: 2px solid #E6FF00;
          padding: 20px 40px;
          background: #060606;
        }
        .acl-header-inner {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .acl-logo { height: 24px; width: auto; }
        .acl-doc-type {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #555553;
        }
        .acl-main {
          max-width: 760px;
          margin: 0 auto;
          padding: 48px 40px 80px;
        }
        .acl-title-block {
          border-bottom: 1px solid #e0e0de;
          padding-bottom: 32px;
          margin-bottom: 32px;
        }
        .acl-eyebrow {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #888886;
          margin-bottom: 12px;
        }
        .acl-title {
          font-family: "Chakra Petch", monospace;
          font-weight: 600;
          font-size: 32px;
          letter-spacing: -0.02em;
          color: #060606;
          margin: 0 0 12px;
          line-height: 1.1;
        }
        .acl-subtitle {
          font-size: 16px;
          line-height: 1.6;
          color: #444442;
          margin: 0 0 16px;
        }
        .acl-meta {
          display: flex;
          gap: 8px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #aaa;
        }
        .acl-meta-sep { color: #ccc; }
        .acl-intro {
          margin-bottom: 40px;
        }
        .acl-intro p {
          font-size: 15px;
          line-height: 1.7;
          color: #444442;
          margin: 0 0 14px;
        }
        .acl-section {
          margin-bottom: 36px;
          page-break-inside: avoid;
        }
        .acl-section-title {
          font-family: "Chakra Petch", monospace;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.01em;
          color: #060606;
          border-left: 3px solid #E6FF00;
          padding-left: 12px;
          margin: 0 0 14px;
        }
        .acl-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .acl-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 14px;
          line-height: 1.55;
          color: #333331;
        }
        .acl-checkbox {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border: 1.5px solid #ccc;
          border-radius: 3px;
          margin-top: 1px;
          display: inline-block;
        }
        .acl-cta-block {
          margin-top: 48px;
          background: #f7f7f5;
          border-radius: 6px;
          padding: 32px 36px;
        }
        .acl-cta-rule {
          display: none;
        }
        .acl-cta-title {
          font-family: "Chakra Petch", monospace;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.015em;
          color: #060606;
          margin: 0 0 12px;
        }
        .acl-cta-body {
          font-size: 14px;
          line-height: 1.65;
          color: #555553;
          margin: 0 0 20px;
        }
        .acl-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .acl-btn-primary {
          display: inline-flex;
          align-items: center;
          background: #E6FF00;
          color: #060606;
          font-family: "Chakra Petch", monospace;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.01em;
          padding: 14px 22px;
          border-radius: 3px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .acl-btn-primary:hover { background: #d4ee00; }
        .acl-btn-secondary {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #060606;
          font-family: "Chakra Petch", monospace;
          font-weight: 500;
          font-size: 13px;
          padding: 14px 22px;
          border-radius: 3px;
          border: 1.5px solid #ccc;
          text-decoration: none;
          transition: border-color 0.2s;
        }
        .acl-btn-secondary:hover { border-color: #888; }
        .acl-cta-contact {
          font-size: 13px;
          color: #888886;
          margin: 0;
        }
        .acl-cta-contact a { color: #060606; text-decoration: underline; text-underline-offset: 2px; }
        .acl-footer {
          margin-top: 48px;
        }
        .acl-footer-rule {
          border: none;
          border-top: 1px solid #e0e0de;
          margin-bottom: 16px;
        }
        .acl-footer-inner {
          display: flex;
          gap: 8px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #aaa;
        }
        @media print {
          .acl-header { background: #060606 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .acl-cta-block { background: #f7f7f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .acl-section-title { border-left-color: #E6FF00 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .acl-cta-row { display: none; }
          .acl-cta-block::after {
            content: "Book a consult: calendly.com/mvw-mattvincentwalker/ai-audit  ·  See the setup: 6signal.co/apple";
            display: block;
            font-family: "JetBrains Mono", ui-monospace, monospace;
            font-size: 10px;
            letter-spacing: 0.1em;
            color: #555553;
            margin-top: 8px;
          }
          .acl-page { margin: 0; }
        }
        @media (max-width: 600px) {
          .acl-main { padding: 32px 20px 60px; }
          .acl-header { padding: 16px 20px; }
          .acl-cta-block { padding: 24px 20px; }
          .acl-cta-row { flex-direction: column; }
          .acl-btn-primary, .acl-btn-secondary { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
