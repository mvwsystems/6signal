"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONSTRUCTION_SOFTWARE,
  SOFTWARE_CATEGORIES,
  categorySlug,
  type AIStatus,
} from "../data/constructionSoftware";

// Trade chips match against each product's "Contractor focus" field only, so a
// chip means "the vendor names this trade as an audience" — not a keyword hit
// somewhere in the copy.
const TRADES: { label: string; re: RegExp }[] = [
  { label: "HVAC", re: /hvac|mechanical|refrigeration|heating/i },
  { label: "Plumbing", re: /plumb/i },
  { label: "Electrical", re: /electric/i },
  { label: "Roofing", re: /roof/i },
  { label: "Remodeling", re: /remodel|renovation|kitchen-and-bath/i },
  { label: "Home builders", re: /home ?builder|homebuilder|custom home|home builders/i },
  { label: "Landscaping", re: /landscap|hardscape/i },
  { label: "Concrete", re: /concrete/i },
  { label: "General contractors", re: /general contractor|\bgcs?\b|general,/i },
  { label: "Heavy civil", re: /heavy|civil|infrastructure|earthwork|excavat|grading/i },
];

type AIFilter = "all" | AIStatus;

const AI_LABEL: Record<AIStatus, string> = {
  vendor: "Vendor-described AI",
  unverified: "AI not verified",
};

export default function ConstructionSoftwareCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [ai, setAi] = useState<AIFilter>("all");
  const [trade, setTrade] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // #c-<category-slug> deep links (the category grid above links here).
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash;
      if (!h.startsWith("#c-")) return;
      const slug = h.slice(3);
      const match = SOFTWARE_CATEGORIES.find((c) => categorySlug(c) === slug);
      if (!match) return;
      setCategory(match);
      setQuery("");
      setTrade(null);
      setAi("all");
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tradeRe = TRADES.find((t) => t.label === trade)?.re;
    return CONSTRUCTION_SOFTWARE.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (ai !== "all" && p.aiStatus !== ai) return false;
      if (tradeRe && !tradeRe.test(p.contractorFocus)) return false;
      if (q) {
        const hay = [
          p.name,
          p.category,
          p.description,
          p.usedFor,
          p.contractorFocus,
          p.aiFeatures,
          p.notes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, category, ai, trade]);

  const filtered =
    query.trim() !== "" || category !== "all" || ai !== "all" || trade !== null;

  const reset = () => {
    setQuery("");
    setCategory("all");
    setAi("all");
    setTrade(null);
    if (window.location.hash.startsWith("#c-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="csw-catalog" ref={sectionRef}>
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="csw-controls">
        <div className="csw-control-row">
          <label className="csw-field csw-field-search">
            <span className="csw-field-label">Search</span>
            <input
              type="search"
              className="csw-input"
              placeholder="Product, workflow, trade or feature"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="csw-field">
            <span className="csw-field-label">Category</span>
            <select
              className="csw-input csw-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {SOFTWARE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="csw-field">
            <span className="csw-field-label">AI status</span>
            <div className="csw-seg" role="group" aria-label="AI status">
              {(["all", "vendor", "unverified"] as AIFilter[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`csw-seg-btn${ai === v ? " is-on" : ""}`}
                  aria-pressed={ai === v}
                  onClick={() => setAi(v)}
                >
                  {v === "all" ? "All" : AI_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="csw-chip-row" role="group" aria-label="Filter by trade">
          <span className="csw-field-label">Trade</span>
          {TRADES.map((t) => (
            <button
              key={t.label}
              type="button"
              className={`csw-chip${trade === t.label ? " is-on" : ""}`}
              aria-pressed={trade === t.label}
              onClick={() => setTrade(trade === t.label ? null : t.label)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="csw-status-row">
          <span className="csw-count" aria-live="polite">
            {results.length} of {CONSTRUCTION_SOFTWARE.length} products
          </span>
          {filtered && (
            <button type="button" className="csw-reset" onClick={reset}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────── */}
      {results.length === 0 ? (
        <div className="csw-empty">
          <p>No products match those filters.</p>
          <button type="button" className="csw-reset" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="csw-list">
          {results.map((p) => (
            <li key={p.name} className="csw-item">
              <details className="csw-details">
                <summary className="csw-summary">
                  <div className="csw-summary-main">
                    <div className="csw-name-row">
                      <span className="csw-name">{p.name}</span>
                      <span
                        className={`csw-ai-badge csw-ai-${p.aiStatus}`}
                        title={AI_LABEL[p.aiStatus]}
                      >
                        {AI_LABEL[p.aiStatus]}
                      </span>
                    </div>
                    <span className="csw-cat">{p.category}</span>
                    <p className="csw-desc">{p.description}</p>
                  </div>
                  <span className="csw-toggle" aria-hidden="true">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M6 1v10M1 6h10" />
                    </svg>
                  </span>
                </summary>

                <div className="csw-body">
                  <div className="csw-grid">
                    <div className="csw-cell">
                      <span className="csw-cell-label">Used for</span>
                      <p className="csw-cell-val">{p.usedFor}</p>
                    </div>
                    <div className="csw-cell">
                      <span className="csw-cell-label">Contractor focus</span>
                      <p className="csw-cell-val">{p.contractorFocus}</p>
                    </div>
                    <div className="csw-cell csw-cell-wide">
                      <span className="csw-cell-label">
                        AI status — {AI_LABEL[p.aiStatus]}
                      </span>
                      <p className="csw-cell-val">{p.aiFeatures}</p>
                    </div>
                    {p.notes && (
                      <div className="csw-cell csw-cell-wide">
                        <span className="csw-cell-label">Notes</span>
                        <p className="csw-cell-val">{p.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="csw-sources">
                    <span className="csw-cell-label">Sources</span>
                    <ul>
                      {p.sources.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="csw-source-link"
                          >
                            <span className="csw-source-type">{s.label}</span>
                            <span className="csw-source-url">
                              {s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
