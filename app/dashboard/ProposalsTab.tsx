"use client";
import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Printable client proposals (retainer quotes), matching the 6Signal engagement
// proposal template: dark header band per page, line-item tables with
// included/justification/price columns, market-rate comparison, and standard
// terms + signature pages. Saved to Supabase (proposals table) so they can be
// reopened, revised, and reprinted. Self-contained inline styling, matching the
// rest of /dashboard (no globals.css changes except the print-area rule).
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  bg: "#060606", panel: "#0e0e0c", panel2: "#141412",
  border: "rgba(255,255,255,0.07)", accent: "#E6FF00",
  text: "#f5f5f3", textSub: "#a8a8a3", muted: "#6a6a64", danger: "#ef4444", ok: "#22c55e",
};
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISP = "'Chakra Petch', sans-serif";
const BODY = "'Inter', sans-serif";

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 20, ...extra });
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted };
const btn = (primary?: boolean): React.CSSProperties => ({
  background: primary ? T.accent : "transparent", color: primary ? "#060606" : T.text,
  border: `1px solid ${primary ? T.accent : T.border}`, borderRadius: 2, padding: "10px 16px",
  fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer",
});
const inputStyle: React.CSSProperties = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "9px 12px", borderRadius: 2, outline: "none", width: "100%" };
const label: React.CSSProperties = { ...eyebrow, fontSize: 10, marginBottom: 5, display: "block" };

interface Biz { id: string; name: string; url: string | null; trade: string; city: string }

interface ProposalItem { label: string; badge: string; included: string; justification: string; price: string }
interface ProposalSection { number: string; kind: "setup" | "monthly"; title: string; intro: string; items: ProposalItem[]; totalLabel: string; totalNote: string; totalPrice: string }
interface MarketRow { label: string; range: string }
interface ProposalDoc {
  clientName: string; businessId: string | null; businessName: string;
  preparedBy: string; date: string; docType: string;
  headline: string; subhead: string;
  sections: ProposalSection[];
  marketRate: MarketRow[];
  includeTerms: boolean;
}
interface SavedProposal { id: string; business_id: string | null; client_name: string; payload: ProposalDoc; created_at: string; updated_at: string }

const blankItem = (): ProposalItem => ({ label: "", badge: "", included: "", justification: "", price: "" });

const STABILIZE_TEMPLATE = (): ProposalSection => ({
  number: "01", kind: "monthly", title: "Stabilize Phase — Monthly Retainer",
  intro: "On the setup fee: describe what the one-time setup delivered, if a setup fee was already paid separately.",
  items: [
    { label: "Operations Automation", badge: "", included: "HouseCall Pro workflow configuration and optimization. Voice agent management — prompts, call log review, script tuning. Monthly operations check-in call.", justification: "Reduces active integration overhead while keeping delivery inside the client's existing tools.", price: "$297/mo" },
    { label: "Growth Infrastructure", badge: "", included: "Dashboard maintained as a reporting layer. Email triage tuning. Voice agent operational continuity. Uptime monitoring.", justification: "Infrastructure still runs and requires maintenance — this fee reflects that reduced but real ongoing work.", price: "$200/mo" },
  ],
  totalLabel: "Total Monthly", totalNote: "Setup fee previously paid; no additional setup charges apply.", totalPrice: "$497/mo",
});

const SCALE_TEMPLATE = (): ProposalSection => ({
  number: "02", kind: "setup", title: "Scale Phase — Pricing & Justification",
  intro: "On prior quotes: note any verbal quotes given previously, so the discount below reads as real.",
  items: [
    { label: "PPC Campaign Build", badge: "", included: "Google Ads account setup, keyword research, campaign structure, ad copy, conversion tracking, GA4 and Tag Manager configuration.", justification: "Comparable DFW agency setup fees: $750–1,200.", price: "$500" },
    { label: "Meta Ads Setup", badge: "", included: "Business Manager config, Meta Pixel install, audience builds (lookalike + retargeting), creative frameworks, A/B test structure, campaign launch.", justification: "Audience architecture and pixel setup are non-trivial. Not a boost-post engagement.", price: "$500" },
    { label: "AI Visibility Audit", badge: "NEW", included: "Audit of AI engine presence across ChatGPT, Perplexity, Gemini, Google AI Overviews. Citation analysis, structured data build, GEO/AEO foundation.", justification: "Foundation for all monthly AI visibility work — cannot be waived.", price: "$500" },
  ],
  totalLabel: "Setup Total", totalNote: "Loyalty discount applied for an existing client.", totalPrice: "$1,500",
});

const SCALE_MONTHLY_TEMPLATE = (): ProposalSection => ({
  number: "02b", kind: "monthly", title: "Scale Phase — Monthly Retainer",
  intro: "",
  items: [
    { label: "PPC Management", badge: "BELOW MARKET", included: "Active keyword optimization, bid management, negative keyword expansion, ad copy testing, weekly performance review, monthly reporting.", justification: "Standalone DFW PPC for this trade: $750–1,200/mo. This is the bundled loyalty rate.", price: "$497/mo" },
    { label: "Meta Ads Management", badge: "BELOW MARKET", included: "Creative refresh cadence, audience optimization, retargeting management, lookalike scaling, A/B analysis, monthly reporting.", justification: "Audiences fatigue fast — active creative management is not optional.", price: "$497/mo" },
    { label: "6Signal AI Visibility", badge: "FOUNDING RATE", included: "SEO, GEO, AEO, local citation management, monthly AI appearance audit, structured data maintenance, competitor signal monitoring.", justification: "Card rate: $1,250/mo. No DFW agency offers true AI visibility across all six signal layers.", price: "$997/mo" },
    { label: "Ad Spend Fee", badge: "", included: "Management fee on Google + Meta ad spend. Client-owned accounts; spend billed directly to Client's card. Invoiced separately from retainer.", justification: "Scales with results.", price: "15% of spend" },
  ],
  totalLabel: "Monthly Total", totalNote: "Excludes ad spend passthrough.", totalPrice: "$1,991/mo",
});

const DEFAULT_MARKET_RATE: MarketRow[] = [
  { label: "Mid-tier DFW agency · PPC management only", range: "$750 – $1,200/mo" },
  { label: "Mid-tier DFW agency · Meta Ads management only", range: "$750 – $1,000/mo" },
  { label: "Traditional SEO agency · local service business", range: "$1,000 – $1,500/mo" },
  { label: "Combined market rate · all three, no AI visibility layer", range: "$2,500 – $3,700/mo" },
];

const blankDoc = (): ProposalDoc => ({
  clientName: "", businessId: null, businessName: "",
  preparedBy: "Matt Vincent Walker", date: new Date().toISOString().slice(0, 10), docType: "Engagement Proposal",
  headline: "Stabilize. Then Scale.", subhead: "Scope, pricing, and justification — line by line.",
  sections: [], marketRate: [], includeTerms: true,
});

export default function ProposalsTab({ businesses }: { businesses: Biz[] }) {
  const [list, setList] = useState<SavedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<ProposalDoc | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "edit" | "print">("list");
  const [saveState, setSaveState] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard/proposals");
      const d = await r.json().catch(() => ({}));
      setList(d.proposals ?? []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const startNew = () => { setDoc(blankDoc()); setEditingId(null); setMode("edit"); setSaveState(null); };
  const openExisting = (p: SavedProposal) => { setDoc(p.payload); setEditingId(p.id); setMode("edit"); setSaveState(null); };

  const save = async () => {
    if (!doc) return;
    setSaveState("Saving…");
    try {
      if (editingId) {
        const r = await fetch(`/api/dashboard/proposals/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientName: doc.clientName, payload: doc }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || "Save failed");
      } else {
        const r = await fetch("/api/dashboard/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: doc.businessId, clientName: doc.clientName, payload: doc }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error || "Save failed");
        setEditingId(d.id);
      }
      setSaveState("Saved ✓");
      load();
    } catch (e: unknown) {
      setSaveState(e instanceof Error ? e.message : "Save failed");
    }
  };

  const updateDoc = (fn: (d: ProposalDoc) => ProposalDoc) => setDoc((d) => (d ? fn(d) : d));

  const addSection = (tpl?: () => ProposalSection) => updateDoc((d) => ({
    ...d,
    sections: [...d.sections, tpl ? tpl() : { number: String(d.sections.length + 1).padStart(2, "0"), kind: "monthly", title: "", intro: "", items: [blankItem()], totalLabel: "Total Monthly", totalNote: "", totalPrice: "" }],
  }));
  const removeSection = (i: number) => updateDoc((d) => ({ ...d, sections: d.sections.filter((_, idx) => idx !== i) }));
  const updateSection = (i: number, fields: Partial<ProposalSection>) => updateDoc((d) => ({ ...d, sections: d.sections.map((s, idx) => (idx === i ? { ...s, ...fields } : s)) }));
  const addItem = (si: number) => updateDoc((d) => ({ ...d, sections: d.sections.map((s, idx) => (idx === si ? { ...s, items: [...s.items, blankItem()] } : s)) }));
  const removeItem = (si: number, ii: number) => updateDoc((d) => ({ ...d, sections: d.sections.map((s, idx) => (idx === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s)) }));
  const updateItem = (si: number, ii: number, fields: Partial<ProposalItem>) => updateDoc((d) => ({ ...d, sections: d.sections.map((s, idx) => (idx === si ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, ...fields } : it)) } : s)) }));

  if (mode === "print" && doc) {
    return (
      <div>
        <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button style={btn()} onClick={() => setMode("edit")}>← Back to editor</button>
          <button style={btn(true)} onClick={() => window.print()}>Download PDF</button>
        </div>
        <ProposalPrintView doc={doc} />
      </div>
    );
  }

  if (mode === "edit" && doc) {
    return (
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button style={btn()} onClick={() => setMode("list")}>← All proposals</button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {saveState && <span style={{ fontSize: 12, color: saveState.includes("✓") ? T.ok : saveState === "Saving…" ? T.muted : T.danger }}>{saveState}</span>}
            <button style={btn()} onClick={save}>Save</button>
            <button style={btn(true)} onClick={() => setMode("print")}>Preview / Print</button>
          </div>
        </div>

        <div style={card({ marginBottom: 16 })}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><span style={label}>Client name</span><input style={inputStyle} value={doc.clientName} onChange={(e) => updateDoc((d) => ({ ...d, clientName: e.target.value }))} placeholder="Daniel Clayburn" /></div>
            <div>
              <span style={label}>Link to business (optional)</span>
              <select style={{ ...inputStyle }} value={doc.businessId ?? ""} onChange={(e) => {
                const b = businesses.find((x) => x.id === e.target.value);
                updateDoc((d) => ({ ...d, businessId: e.target.value || null, businessName: b?.name ?? d.businessName }));
              }}>
                <option value="">— none —</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><span style={label}>Business name (printed)</span><input style={inputStyle} value={doc.businessName} onChange={(e) => updateDoc((d) => ({ ...d, businessName: e.target.value }))} placeholder="X-Act Plumbing" /></div>
            <div><span style={label}>Date</span><input style={inputStyle} value={doc.date} onChange={(e) => updateDoc((d) => ({ ...d, date: e.target.value }))} /></div>
            <div><span style={label}>Document type</span><input style={inputStyle} value={doc.docType} onChange={(e) => updateDoc((d) => ({ ...d, docType: e.target.value }))} placeholder="Engagement Proposal" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span style={label}>Headline</span><input style={inputStyle} value={doc.headline} onChange={(e) => updateDoc((d) => ({ ...d, headline: e.target.value }))} /></div>
            <div><span style={label}>Subhead</span><input style={inputStyle} value={doc.subhead} onChange={(e) => updateDoc((d) => ({ ...d, subhead: e.target.value }))} /></div>
          </div>
        </div>

        {doc.sections.map((s, si) => (
          <div key={si} style={card({ marginBottom: 16 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
                <input style={{ ...inputStyle, width: 50, textAlign: "center" }} value={s.number} onChange={(e) => updateSection(si, { number: e.target.value })} />
                <input style={inputStyle} value={s.title} onChange={(e) => updateSection(si, { title: e.target.value })} placeholder="Section title" />
                <select style={{ ...inputStyle, width: 130 }} value={s.kind} onChange={(e) => updateSection(si, { kind: e.target.value as "setup" | "monthly" })}>
                  <option value="monthly">Monthly</option>
                  <option value="setup">One-time</option>
                </select>
              </div>
              <button style={{ ...btn(), color: T.danger, marginLeft: 10 }} onClick={() => removeSection(si)}>Remove section</button>
            </div>
            <textarea style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} rows={2} value={s.intro} onChange={(e) => updateSection(si, { intro: e.target.value })} placeholder="Optional callout box text above the table (e.g. context on a prior fee)" />

            {s.items.map((it, ii) => (
              <div key={ii} style={{ border: `1px solid ${T.border}`, borderRadius: 2, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px", gap: 8, marginBottom: 8 }}>
                  <input style={inputStyle} value={it.label} onChange={(e) => updateItem(si, ii, { label: e.target.value })} placeholder="Line item label" />
                  <input style={inputStyle} value={it.badge} onChange={(e) => updateItem(si, ii, { badge: e.target.value })} placeholder="Badge (optional)" />
                  <input style={inputStyle} value={it.price} onChange={(e) => updateItem(si, ii, { price: e.target.value })} placeholder="$500/mo" />
                </div>
                <textarea style={{ ...inputStyle, marginBottom: 8, resize: "vertical" }} rows={2} value={it.included} onChange={(e) => updateItem(si, ii, { included: e.target.value })} placeholder="What's included" />
                <textarea style={{ ...inputStyle, resize: "vertical" }} rows={2} value={it.justification} onChange={(e) => updateItem(si, ii, { justification: e.target.value })} placeholder="Justification" />
                <button style={{ ...btn(), color: T.danger, marginTop: 8, padding: "5px 10px", fontSize: 11 }} onClick={() => removeItem(si, ii)}>Remove line item</button>
              </div>
            ))}
            <button style={{ ...btn(), marginBottom: 14 }} onClick={() => addItem(si)}>+ Add line item</button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <input style={inputStyle} value={s.totalLabel} onChange={(e) => updateSection(si, { totalLabel: e.target.value })} placeholder="Total Monthly" />
              <input style={inputStyle} value={s.totalNote} onChange={(e) => updateSection(si, { totalNote: e.target.value })} placeholder="Note under the total" />
              <input style={inputStyle} value={s.totalPrice} onChange={(e) => updateSection(si, { totalPrice: e.target.value })} placeholder="$497/mo" />
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <button style={btn()} onClick={() => addSection()}>+ Blank section</button>
          <button style={btn()} onClick={() => addSection(STABILIZE_TEMPLATE)}>+ Stabilize template</button>
          <button style={btn()} onClick={() => addSection(SCALE_TEMPLATE)}>+ Scale setup template</button>
          <button style={btn()} onClick={() => addSection(SCALE_MONTHLY_TEMPLATE)}>+ Scale monthly template</button>
        </div>

        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 10 }}>Market rate comparison (optional)</div>
          {doc.marketRate.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 40px", gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={r.label} onChange={(e) => updateDoc((d) => ({ ...d, marketRate: d.marketRate.map((row, idx) => (idx === i ? { ...row, label: e.target.value } : row)) }))} />
              <input style={inputStyle} value={r.range} onChange={(e) => updateDoc((d) => ({ ...d, marketRate: d.marketRate.map((row, idx) => (idx === i ? { ...row, range: e.target.value } : row)) }))} />
              <button style={{ ...btn(), color: T.danger, padding: "5px 8px" }} onClick={() => updateDoc((d) => ({ ...d, marketRate: d.marketRate.filter((_, idx) => idx !== i) }))}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btn()} onClick={() => updateDoc((d) => ({ ...d, marketRate: [...d.marketRate, { label: "", range: "" }] }))}>+ Add row</button>
            <button style={btn()} onClick={() => updateDoc((d) => ({ ...d, marketRate: DEFAULT_MARKET_RATE }))}>Use DFW plumbing defaults</button>
          </div>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: T.textSub, marginBottom: 20 }}>
          <input type="checkbox" checked={doc.includeTerms} onChange={(e) => updateDoc((d) => ({ ...d, includeTerms: e.target.checked }))} />
          Include standard Terms &amp; Conditions + signature pages
        </label>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16 }}>Proposals</div>
        <button style={btn(true)} onClick={startNew}>New proposal</button>
      </div>
      <div style={card({ padding: 0, overflow: "hidden" })}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>
          <span>Client</span><span>Business</span><span>Updated</span><span style={{ textAlign: "right" }}>Total</span>
        </div>
        {loading && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Loading…</div>}
        {!loading && list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No proposals yet. Click "New proposal" to start from a template.</div>}
        {list.map((p) => (
          <div key={p.id} onClick={() => openExisting(p)} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: T.text }}>{p.client_name || "—"}</span>
            <span style={{ fontSize: 13, color: T.textSub }}>{p.payload?.businessName || "—"}</span>
            <span style={{ fontSize: 12, color: T.muted }}>{new Date(p.updated_at).toLocaleDateString()}</span>
            <span style={{ fontSize: 13, color: T.accent, textAlign: "right", fontFamily: MONO }}>{p.payload?.sections?.[p.payload.sections.length - 1]?.totalPrice || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Print-ready render ────────────────────────────────────────────────────

const PAGE: React.CSSProperties = {
  background: "#f4f3ef", color: "#1a1a1a", width: "8.5in", minHeight: "11in",
  margin: "0 auto 24px", boxSizing: "border-box", fontFamily: BODY, position: "relative",
};
const HEADER_BAND: React.CSSProperties = { background: "#0a0a0a", color: "#f5f5f3", padding: "28px 48px" };
const PAGE_BODY: React.CSSProperties = { padding: "36px 48px" };
const PMONO: React.CSSProperties = { fontFamily: MONO };

function PageHeader({ meta }: { meta: string }) {
  return (
    <div style={HEADER_BAND}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 22 }}>6<span style={{ color: T.accent }}>Signal</span></div>
          <div style={{ ...PMONO, fontSize: 9, letterSpacing: "0.2em", color: "#9a9a97", marginTop: 2 }}>AI VISIBILITY + INFRASTRUCTURE</div>
        </div>
        <div style={{ textAlign: "right", ...PMONO, fontSize: 10, color: "#c8c8c4", lineHeight: 1.8 }}>{meta}</div>
      </div>
    </div>
  );
}
function PageFooter({ doc, page }: { doc: ProposalDoc; page: string }) {
  return (
    <div style={{ position: "absolute", bottom: 24, left: 48, right: 48, display: "flex", justifyContent: "space-between", ...PMONO, fontSize: 9, color: "#8a8a86", borderTop: "1px solid #d8d8d2", paddingTop: 10 }}>
      <span>6Signal — Confidential</span>
      <span>{page} · {doc.businessName} · {doc.date}</span>
    </div>
  );
}
function Badge({ text }: { text: string }) {
  if (!text) return null;
  return <span style={{ ...PMONO, fontSize: 9, background: "#0a0a0a", color: "#f5f5f3", padding: "2px 6px", marginLeft: 8 }}>{text}</span>;
}

function SectionPage({ doc, section, index, total, totalPages }: { doc: ProposalDoc; section: ProposalSection; index: number; total: number; totalPages: number }) {
  return (
    <div style={PAGE}>
      <PageHeader meta={`Client — ${doc.clientName} / ${doc.businessName}\nDate — ${doc.date}`} />
      <div style={PAGE_BODY}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 20 }}>
          <span style={{ ...PMONO, fontSize: 11, background: "#0a0a0a", color: "#f5f5f3", padding: "3px 8px" }}>{section.number}</span>
          <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18 }}>{section.title}</span>
        </div>
        {section.intro && (
          <div style={{ background: "#e9e8e2", padding: 16, fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>{section.intro}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr 1.4fr 0.6fr", ...PMONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a8a86", borderBottom: "1px solid #1a1a1a", paddingBottom: 8, marginBottom: 4 }}>
          <span>Line item</span><span>What&rsquo;s included</span><span>Justification</span><span style={{ textAlign: "right" }}>{section.kind === "setup" ? "Fee" : "Monthly"}</span>
        </div>
        {section.items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr 1.4fr 0.6fr", gap: 12, padding: "14px 0", borderBottom: "1px solid #d8d8d2" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{it.label}{it.badge && <div><Badge text={it.badge} /></div>}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.55 }}>{it.included}</div>
            <div style={{ fontSize: 11.5, lineHeight: 1.55, fontStyle: "italic", color: "#4a4a46" }}>{it.justification}</div>
            <div style={{ fontWeight: 700, fontSize: 13, textAlign: "right" }}>{it.price}</div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr 1.4fr 0.6fr", gap: 12, padding: "16px 0", marginTop: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{section.totalLabel}</div>
          <div style={{ gridColumn: "2 / 4", fontSize: 11.5, fontStyle: "italic", color: "#4a4a46" }}>{section.totalNote}</div>
          <div style={{ fontWeight: 700, fontSize: 15, textAlign: "right" }}>{section.totalPrice}</div>
        </div>

        {index === total - 1 && doc.marketRate.length > 0 && (
          <div style={{ marginTop: 20, background: "#e9e8e2", padding: "14px 18px" }}>
            <div style={{ ...PMONO, fontSize: 9, letterSpacing: "0.1em", color: "#8a8a86", marginBottom: 10 }}>MARKET RATE COMPARISON</div>
            {doc.marketRate.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: i < doc.marketRate.length - 1 ? "1px solid #d8d8d2" : "none" }}>
                <span>{r.label}</span><span style={{ fontWeight: 700 }}>{r.range}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <PageFooter doc={doc} page={`Page ${index + 2} of ${totalPages}`} />
    </div>
  );
}

function CoverPage({ doc, totalPages }: { doc: ProposalDoc; totalPages: number }) {
  return (
    <div style={PAGE}>
      <div style={{ ...HEADER_BAND, minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 22 }}>6<span style={{ color: T.accent }}>Signal</span></div>
            <div style={{ ...PMONO, fontSize: 9, letterSpacing: "0.2em", color: "#9a9a97", marginTop: 2 }}>AI VISIBILITY + INFRASTRUCTURE</div>
          </div>
          <div style={{ textAlign: "right", ...PMONO, fontSize: 10, color: "#c8c8c4", lineHeight: 1.8 }}>
            Prepared for — {doc.clientName} / {doc.businessName}<br />
            Prepared by — {doc.preparedBy}<br />
            Date — {doc.date} · Type — {doc.docType}
          </div>
        </div>
        <div>
          <div style={{ ...PMONO, fontSize: 10, letterSpacing: "0.2em", color: T.accent, marginBottom: 8 }}>ENGAGEMENT PROPOSAL</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 34 }}>{doc.headline}</div>
          <div style={{ fontSize: 14, color: "#c8c8c4", fontStyle: "italic", marginTop: 6 }}>{doc.subhead}</div>
        </div>
      </div>
      <PageFooter doc={doc} page={`Page 1 of ${totalPages}`} />
    </div>
  );
}

const TERMS_BODY: React.CSSProperties = { fontSize: 11.5, lineHeight: 1.6, color: "#2a2a26" };
const TERMS_H: React.CSSProperties = { fontWeight: 700, fontSize: 13, marginTop: 16, marginBottom: 6 };

function TermsPages({ doc, totalPages }: { doc: ProposalDoc; totalPages: number }) {
  return (
    <>
      <div style={PAGE}>
        <PageHeader meta={`Client — ${doc.clientName} / ${doc.businessName}\nProvider — ${doc.preparedBy}\nDate — ${doc.date}`} />
        <div style={PAGE_BODY}>
          <div style={{ ...PMONO, fontSize: 10, letterSpacing: "0.2em", color: "#8a8a86", marginBottom: 6 }}>SERVICE AGREEMENT</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 24, marginBottom: 20 }}>Terms &amp; Conditions.</div>
          <div style={TERMS_H}>§1 Parties</div>
          <p style={TERMS_BODY}>This Service Agreement ("Agreement") is entered into as of the date signed below, between {doc.preparedBy}, operating as 6Signal ("Provider"), and {doc.clientName}, operating as {doc.businessName} ("Client"). This Agreement governs the engagement described in the accompanying proposal.</p>
          <div style={TERMS_H}>§2 Payment Terms</div>
          <p style={TERMS_BODY}><strong>Due on Receipt.</strong> All invoices are due upon receipt, expected within 48 hours of delivery unless an alternative arrangement is confirmed in writing before invoicing. Invoices are issued on the first business day of each month.</p>
          <p style={TERMS_BODY}><strong>Late Payment.</strong> Invoices unpaid after 7 calendar days are overdue. Provider reserves the right to pause all active services until the balance is settled. Paused time is not refunded or credited.</p>
          <p style={TERMS_BODY}><strong>Setup Fee.</strong> Any one-time setup fee is due in full prior to work commencement. Work does not begin until cleared.</p>
          <p style={TERMS_BODY}><strong>Ad Spend — Client-Owned.</strong> All advertising spend (Google Ads, Meta Ads) is owned and funded directly by the Client, billed to Client's payment method. Provider does not handle or advance ad spend funds. Any management fee on ad spend is invoiced separately from the retainer.</p>
          <div style={TERMS_H}>§3 Term &amp; Cancellation</div>
          <p style={TERMS_BODY}><strong>Initial Term.</strong> This Agreement begins on the date of first invoice payment and runs for a minimum of six (6) consecutive months. Canceling before six months does not obligate Provider to refund any fees paid.</p>
          <p style={TERMS_BODY}><strong>Month-to-Month After Initial Term.</strong> After the six-month initial term, the Agreement converts automatically to month-to-month and continues until terminated by either party per the notice requirements below.</p>
          <p style={TERMS_BODY}><strong>30-Day Written Notice.</strong> Either party may terminate after the initial term by delivering written notice at least 30 calendar days before the intended termination date. Written notice means a clear, dated email to the other party's primary email address on file — text messages, verbal statements, and social media messages do not qualify. The 30-day clock begins when the email is sent and confirmed received. Retainer fees continue to accrue during the notice period.</p>
          <p style={TERMS_BODY}><strong>Early Termination.</strong> If Client terminates during the initial six-month term, all remaining months become due immediately as a termination fee. Provider may waive this at sole discretion but is not obligated to do so.</p>
        </div>
        <PageFooter doc={doc} page={`Page ${totalPages - 1} of ${totalPages}`} />
      </div>

      <div style={PAGE}>
        <PageHeader meta={`Client — ${doc.clientName} / ${doc.businessName}\nProvider — ${doc.preparedBy}\nDate — ${doc.date}`} />
        <div style={PAGE_BODY}>
          <div style={{ ...PMONO, fontSize: 10, letterSpacing: "0.2em", color: "#8a8a86", marginBottom: 6 }}>SERVICE AGREEMENT · CONTINUED</div>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 24, marginBottom: 20 }}>Scope &amp; Signatures.</div>
          <div style={TERMS_H}>§4 Scope of Work</div>
          <p style={TERMS_BODY}><strong>What's Included.</strong> The monthly retainer covers the services listed in the proposal above.</p>
          <p style={TERMS_BODY}><strong>What's Not Included.</strong> Outside scope and quoted separately if requested: new website builds or major redesigns; custom software, dashboard, or automation development; additional ad platforms; reputation management beyond standard review monitoring; social media content creation or community management; print, radio, or broadcast advertising; work for entities outside Client's primary service area.</p>
          <p style={TERMS_BODY}><strong>Change Requests.</strong> Out-of-scope work requires a written estimate and written approval from Client before proceeding. Requests do not become obligations.</p>
          <div style={TERMS_H}>§5 General</div>
          <p style={TERMS_BODY}><strong>Governing Law.</strong> This Agreement shall be governed by the laws of the State of Texas. Any disputes arising under this Agreement shall be resolved in Tarrant County, TX.</p>
          <p style={TERMS_BODY}><strong>Entire Agreement.</strong> This document, together with the accompanying proposal, constitutes the entire agreement between the parties and supersedes all prior verbal or written discussions, quotes, or representations regarding scope, pricing, or deliverables.</p>
          <p style={TERMS_BODY}><strong>Amendments.</strong> Any modifications to this Agreement must be made in writing and signed by both parties to be enforceable.</p>

          <div style={{ background: "#e9e8e2", padding: 20, marginTop: 24 }}>
            <div style={{ ...PMONO, fontSize: 9, letterSpacing: "0.15em", color: "#8a8a86", marginBottom: 20 }}>SIGNATURES</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              <div>
                <div style={{ ...PMONO, fontSize: 9, color: "#8a8a86", marginBottom: 40 }}>PROVIDER SIGNATURE</div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 6, fontSize: 12 }}>{doc.preparedBy} · 6Signal</div>
                <div style={{ ...PMONO, fontSize: 9, color: "#8a8a86", marginTop: 14 }}>DATE: ______________</div>
              </div>
              <div>
                <div style={{ ...PMONO, fontSize: 9, color: "#8a8a86", marginBottom: 40 }}>CLIENT SIGNATURE</div>
                <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 6, fontSize: 12 }}>{doc.clientName} · {doc.businessName}</div>
                <div style={{ ...PMONO, fontSize: 9, color: "#8a8a86", marginTop: 14 }}>DATE: ______________</div>
              </div>
            </div>
          </div>
        </div>
        <PageFooter doc={doc} page={`Page ${totalPages} of ${totalPages}`} />
      </div>
    </>
  );
}

function ProposalPrintView({ doc }: { doc: ProposalDoc }) {
  const totalPages = 1 + doc.sections.length + (doc.includeTerms ? 2 : 0);
  return (
    <div className="proposal-print-area">
      <CoverPage doc={doc} totalPages={totalPages} />
      {doc.sections.map((s, i) => (
        <SectionPage key={i} doc={doc} section={s} index={i} total={doc.sections.length} totalPages={totalPages} />
      ))}
      {doc.includeTerms && <TermsPages doc={doc} totalPages={totalPages} />}
    </div>
  );
}
