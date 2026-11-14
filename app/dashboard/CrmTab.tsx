"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T, alpha, MONO, DISP, BODY } from "./theme";
import {
  STATUSES, DEAL_STAGES, SERVICE_ANGLES, CATEGORIES, IMPORT_FIELDS, parseCsv, suggestMapping,
  transformManusExport, ManusExport, Mapping, Prospect, ListFilters, RowVerdict, Verdict, EditableField,
} from "../lib/crmCore";

// ─────────────────────────────────────────────────────────────────────────────
// CRM (Phase C1): the Manus CRM's prospect database, rebuilt inside the
// Command Center. Prospects list with server-side search/filter/sort and saved
// views, a drawer showing every field with inline edit, a CSV import wizard
// that previews a dedupe report before anything is written, and a duplicates
// page where merges are chosen by a person and logged. Every write goes to the
// activity log. Self-contained inline styling, like the other dashboard tabs.
// ─────────────────────────────────────────────────────────────────────────────

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...extra });
const eyebrow: React.CSSProperties = { fontFamily: BODY, fontSize: 13, fontWeight: 600, letterSpacing: 0, color: T.textSub };
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, padding: "0 16px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const label: React.CSSProperties = { ...eyebrow, fontSize: 12, fontWeight: 500, marginBottom: 6, display: "block" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
// Manus-style rounded pill: filter chips and the CRM's own section switcher.
const pill = (on: boolean): React.CSSProperties => ({
  fontFamily: BODY, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub,
});
// Status colors from the Manus CRM's prospect list.
const STATUS_HUE: Record<string, string> = {
  "Never contacted": "#64748b", "Not now": "#64748b", "Dead": "#64748b",
  Contacted: "#2563eb", Replied: "#d97706", Interested: "#16a34a", Customer: "#16a34a", "Do Not Contact": "#dc2626",
};
function StatusPill({ status }: { status: string }) {
  if (status === "Closed") return <span className="dash-pill" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: T.text, color: T.bg, border: `1px solid ${T.text}`, whiteSpace: "nowrap" }}>{status}</span>;
  const hue = STATUS_HUE[status] ?? "#64748b";
  return <span className="dash-pill" style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{status}</span>;
}
const th: React.CSSProperties = { fontFamily: BODY, fontSize: 13, fontWeight: 500, color: T.text, padding: "0 10px", height: 40, textAlign: "left", whiteSpace: "nowrap", borderBottom: `1px solid ${T.border}` };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as T;
}

function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13, marginBottom: 12 })}>{msg}</div>;
}

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export default function CrmTab() {
  const [view, setView] = useState<"dashboard" | "hitlist" | "pipeline" | "prospects" | "customers" | "import" | "duplicates">("dashboard");
  // A count card's arrow opens Prospects already filtered; the key remounts
  // the list so it starts from that filter.
  const [preset, setPreset] = useState<{ key: number; filters: Partial<ListFilters> }>({ key: 0, filters: {} });
  const openList = (filters: Partial<ListFilters>) => { setPreset((p) => ({ key: p.key + 1, filters })); setView("prospects"); };
  return (
    <div>
      <div role="tablist" aria-label="CRM sections" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {([["dashboard", "Dashboard"], ["hitlist", "Hit List"], ["pipeline", "Pipeline"], ["prospects", "Prospects"], ["customers", "Customers"], ["import", "Import"], ["duplicates", "Duplicates"]] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className="dash-pill" style={{ ...pill(view === id), fontSize: 13, padding: "6px 14px" }} onClick={() => { if (id === "prospects" && view !== "prospects") setPreset((p) => ({ key: p.key + 1, filters: {} })); setView(id); }}>{l}</button>
        ))}
      </div>
      {view === "dashboard" && <DashboardView onOpenList={openList} />}
      {view === "hitlist" && <HitListView />}
      {view === "pipeline" && <PipelineView />}
      {view === "prospects" && <ProspectsView key={preset.key} initial={preset.filters} />}
      {view === "customers" && <CustomersView />}
      {view === "import" && <ImportView />}
      {view === "duplicates" && <DuplicatesView />}
    </div>
  );
}

// ─── CRM dashboard (Manus look) ──────────────────────────────────────────────
// Six stat cards with icon badges and a Recent Activity card with filter
// pills, laid out like the Manus CRM dashboard. Numbers come from the live
// tables; email and campaign numbers arrive with sequences (C4).

interface CrmStats {
  total: number; withEmail: number; withPhone: number; decisionMakers: number; contacted: number; customers: number;
  activity: { id: string; entity_type: string; action: string; summary: string; created_at: string }[];
}

const STAT_ICONS: Record<string, string> = {
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  id: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9zM12 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 19c.6-1.7 2.2-3 4-3s3.4 1.3 4 3",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  handshake: "M11 17l2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a3.7 3.7 0 0 1 4.2-.7l.6.3a2 2 0 0 0 1.6.1L21 4M21 3l1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8",
  activity: "M3 21h18M5 21V10M10 21V4M15 21v-7M20 21V8",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
};
function StatIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={STAT_ICONS[name]} />
    </svg>
  );
}

const ACTIVITY_RANGES = [["all", "All", 0], ["week", "Week", 7], ["month", "Month", 30], ["year", "Year", 365]] as const;

function ArrowCircle({ onClick, label, onBrand }: { onClick: () => void; label: string; onBrand?: boolean }) {
  return (
    <button className="dash-pill dash-arrow" aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        background: onBrand ? "#0b0d02" : "transparent", color: onBrand ? "#E6FF00" : T.text, border: `1px solid ${onBrand ? "#0b0d02" : T.border}` }}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
    </button>
  );
}

function DashboardView({ onOpenList }: { onOpenList: (f: Partial<ListFilters>) => void }) {
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<(typeof ACTIVITY_RANGES)[number][0]>("all");
  useEffect(() => {
    api<CrmStats>("/api/dashboard/crm/stats").then(setStats).catch((e) => setErr((e as Error).message));
  }, []);
  const n = (v?: number) => (v == null ? "—" : v.toLocaleString());
  const contactedStatuses = STATUSES.filter((x) => x !== "Never contacted");
  // The first card is the page's one yellow hero card; the rest stay neutral.
  const cards: { icon: string; value: string; label: string; open: Partial<ListFilters> }[] = [
    { icon: "users", value: n(stats?.total), label: "Total Prospects", open: {} },
    { icon: "mail", value: n(stats?.withEmail), label: "With Email", open: { has: ["email"] } },
    { icon: "phone", value: n(stats?.withPhone), label: "With Phone", open: { has: ["phone"] } },
    { icon: "id", value: n(stats?.decisionMakers), label: "Decision Makers", open: { has: ["contacts"] } },
    { icon: "send", value: n(stats?.contacted), label: "Contacted", open: { status: [...contactedStatuses] } },
    { icon: "handshake", value: n(stats?.customers), label: "Customers", open: { status: ["Customer"] } },
  ];
  const days = ACTIVITY_RANGES.find((r) => r[0] === range)?.[2] ?? 0;
  const since = days ? Date.now() - days * 86400000 : 0;
  const activity = (stats?.activity ?? []).filter((a) => !since || new Date(a.created_at).getTime() >= since);
  const cardTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontFamily: BODY, fontSize: 16, fontWeight: 600, color: T.text };
  return (
    <div>
      <ErrorLine msg={err} />
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => {
          const hero = i === 0;
          const fg = hero ? "#0b0d02" : T.text;
          return (
            <div key={c.label} className={`dash-lift dash-fade${hero ? " dash-hero" : ""}`}
              style={card({ padding: 16, display: "flex", flexDirection: "column", gap: 14, minHeight: 132, animationDelay: `${(i + 1) * 60}ms`,
                ...(hero ? { background: T.brand, borderColor: T.brand, color: fg } : {}) })}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: hero ? "rgba(11,13,2,0.10)" : T.iconBg, color: hero ? fg : T.iconFg }}>
                  <StatIcon name={c.icon} />
                </span>
                <ArrowCircle onBrand={hero} label={`Open ${c.label.toLowerCase()} in the prospect list`} onClick={() => onOpenList(c.open)} />
              </div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: fg, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
                <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.2, color: hero ? "rgba(11,13,2,0.72)" : T.muted }}>{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-split" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div className="dash-fade" style={card({ padding: 24, minHeight: 280, display: "flex", flexDirection: "column", animationDelay: "420ms" })}>
          <div style={cardTitle}><span style={{ color: T.muted, display: "flex" }}><StatIcon name="activity" /></span>Email Activity — Last 30 Days</div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", ...muted, fontSize: 14, padding: 24 }}>
            No email activity yet. Sequences come over from Manus in the next step.
          </div>
        </div>
        <div className="dash-fade" style={card({ padding: 0, minHeight: 280, animationDelay: "480ms" })}>
          <div style={{ padding: "24px 24px 8px" }}>
            <div style={cardTitle}><span style={{ color: T.muted, display: "flex" }}><StatIcon name="chat" /></span>Recent Activity</div>
            <div role="group" aria-label="Activity period" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 12 }}>
              {ACTIVITY_RANGES.map(([id, l]) => (
                <button key={id} className="dash-pill" aria-pressed={range === id} onClick={() => setRange(id)} style={{ ...pill(range === id), padding: "2px 10px" }}>{l}</button>
              ))}
            </div>
          </div>
          {activity.length ? (
            <div>
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 8, padding: "12px 24px", borderTop: `1px solid ${T.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: a.entity_type === "import" ? T.brand : a.entity_type === "merge" ? "#d97706" : "#2563eb" }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: T.text, lineHeight: 1.35 }}>{a.summary}</span>
                    <span style={{ display: "block", fontSize: 12, color: T.muted, marginTop: 2 }}>{new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  </span>
                </div>
              ))}
              {activity.length > 8 && <div style={{ ...muted, fontSize: 12, padding: "8px 24px 16px" }}>Showing the latest 8 of {activity.length}.</div>}
            </div>
          ) : (
            <div style={{ padding: "48px 24px", textAlign: "center", ...muted, fontSize: 14 }}>{stats ? "No activity in this period." : err ? "Couldn't load activity." : "Loading…"}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── C2: Hit List, Pipeline, Customers ──────────────────────────────────────

const money = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const idleDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
const sectionTitle: React.CSSProperties = { fontFamily: BODY, fontSize: 16, fontWeight: 600, color: T.text };

interface HitPerson { id: string; company: string; contact_name: string | null; phone: string | null; email: string | null; status: string; city?: string | null; state?: string | null; priority_call_rank?: number | null; last_contact_at?: string | null; updated_at?: string }
interface HitData {
  followUps: { id: string; content: string; scheduled_at: string; prospect: HitPerson | null }[];
  replies: HitPerson[];
  calls: HitPerson[];
}

function HitListView() {
  const [d, setD] = useState<HitData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    try { setD(await api<HitData>(`/api/dashboard/crm/hitlist?until=${encodeURIComponent(end.toISOString())}`)); setErr(null); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const post = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    try { await api("/api/dashboard/crm/hitlist", { method: "POST", body: JSON.stringify(body) }); await load(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const who = (p: HitPerson | null) => p ? [p.contact_name, p.phone || p.email].filter(Boolean).join(" · ") : "";

  return (
    <div>
      <ErrorLine msg={err} />
      <div className="dash-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={card({ padding: 0 })}>
          <div style={{ padding: "20px 20px 12px" }}>
            <div style={sectionTitle}>Follow-ups due today</div>
            <div style={{ ...muted, fontSize: 12, marginTop: 2 }}>Set one from any prospect's details.</div>
          </div>
          {d?.followUps.length ? d.followUps.map((f) => {
            const overdue = new Date(f.scheduled_at) < today;
            return (
              <div key={f.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 20px", borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => f.prospect && setOpenId(f.prospect.id)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: T.text, fontFamily: BODY }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.prospect?.company ?? "—"}</div>
                  <div style={{ ...muted, fontSize: 12 }}>{f.content}{who(f.prospect) ? ` · ${who(f.prospect)}` : ""}</div>
                </button>
                {overdue && <span className="dash-pill" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: alpha(T.danger, 12), color: T.danger, border: `1px solid ${alpha(T.danger, 30)}`, whiteSpace: "nowrap" }}>Overdue {fmtDate(f.scheduled_at)}</span>}
                <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12 })} disabled={busy === f.id} onClick={() => post(f.id, { action: "done", noteId: f.id })}>{busy === f.id ? "Saving…" : "Mark done"}</button>
              </div>
            );
          }) : <div style={{ ...muted, padding: "24px 20px", borderTop: `1px solid ${T.border}` }}>{d ? "Nothing due today." : "Loading…"}</div>}
        </div>

        <div style={card({ padding: 0 })}>
          <div style={{ padding: "20px 20px 12px" }}>
            <div style={sectionTitle}>Replies to work</div>
            <div style={{ ...muted, fontSize: 12, marginTop: 2 }}>Prospects marked Replied. Change their status once handled.</div>
          </div>
          {d?.replies.length ? d.replies.map((r) => (
            <button key={r.id} onClick={() => setOpenId(r.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: `1px solid ${T.border}`, padding: "12px 20px", cursor: "pointer", color: T.text, fontFamily: BODY }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.company}</div>
              <div style={{ ...muted, fontSize: 12 }}>{who(r) || "No contact on file"} · waiting {idleDays(r.updated_at!)} days</div>
            </button>
          )) : <div style={{ ...muted, padding: "24px 20px", borderTop: `1px solid ${T.border}` }}>{d ? "No unworked replies." : "Loading…"}</div>}
        </div>
      </div>

      <div style={card({ padding: 0 })}>
        <div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={sectionTitle}>Priority call list</div>
            <div style={{ ...muted, fontSize: 12, marginTop: 2 }}>{d ? `${d.calls.length} companies, in your order.` : ""} Add more from any prospect's details.</div>
          </div>
        </div>
        <div className="xscroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
            <thead><tr>{["#", "Company", "Contact", "Phone", "Status", "Last contact", ""].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {(d?.calls ?? []).map((c, i, arr) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setOpenId(c.id)}>
                  <td style={{ padding: 10, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{c.priority_call_rank}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{c.company}<div style={{ ...muted, fontSize: 12, fontWeight: 400 }}>{[c.city, c.state].filter(Boolean).join(", ")}</div></td>
                  <td style={{ padding: 10 }}>{c.contact_name ?? "—"}</td>
                  <td style={{ padding: 10, whiteSpace: "nowrap" }}>{c.phone ? <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} onClick={(e) => e.stopPropagation()} style={{ color: T.text }}>{c.phone}</a> : "—"}</td>
                  <td style={{ padding: 10 }}><StatusPill status={c.status} /></td>
                  <td style={{ padding: 10, color: T.textSub }}>{fmtDate(c.last_contact_at)}</td>
                  <td style={{ padding: 10, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                    <button aria-label={`Move ${c.company} up`} style={btn(false, { height: 28, padding: "0 8px", fontSize: 12 })} disabled={i === 0 || !!busy} onClick={() => post(c.id + "up", { action: "rank", prospectId: c.id, op: "up" })}>↑</button>{" "}
                    <button aria-label={`Move ${c.company} down`} style={btn(false, { height: 28, padding: "0 8px", fontSize: 12 })} disabled={i === arr.length - 1 || !!busy} onClick={() => post(c.id + "down", { action: "rank", prospectId: c.id, op: "down" })}>↓</button>{" "}
                    <button style={btn(false, { height: 28, padding: "0 8px", fontSize: 12, color: T.muted })} disabled={!!busy} onClick={() => post(c.id + "rm", { action: "rank", prospectId: c.id, op: "remove" })}>Remove</button>
                  </td>
                </tr>
              ))}
              {d && !d.calls.length && <tr><td colSpan={7} style={{ ...muted, padding: 24, textAlign: "center" }}>The call list is empty.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {openId && <ProspectDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

type Stage = (typeof DEAL_STAGES)[number];
interface PipeCard { id: string; company: string; contact_name: string | null; city: string | null; state: string | null; status: string; service_angle: string | null; deal_stage: Stage; deal_value: number; updated_at: string }
interface PipeData { totals: Record<string, { count: number; value: number }>; cards: Record<string, PipeCard[]> }

function PipelineView() {
  const [angle, setAngle] = useState("");
  const [d, setD] = useState<PipeData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setD(await api<PipeData>(`/api/dashboard/crm/pipeline${angle ? `?angle=${encodeURIComponent(angle)}` : ""}`)); setErr(null); }
    catch (e) { setErr((e as Error).message); }
  }, [angle]);
  useEffect(() => { load(); }, [load]);

  const more = async (stage: string) => {
    if (!d) return;
    const offset = d.cards[stage]?.length ?? 0;
    try {
      const r = await api<PipeData>(`/api/dashboard/crm/pipeline?stage=${encodeURIComponent(stage)}&offset=${offset}${angle ? `&angle=${encodeURIComponent(angle)}` : ""}`);
      setD((cur) => cur && ({ ...cur, cards: { ...cur.cards, [stage]: [...(cur.cards[stage] ?? []), ...(r.cards[stage] ?? [])] } }));
    } catch (e) { setErr((e as Error).message); }
  };

  const move = async (c: PipeCard, stage: string) => {
    if (c.deal_stage === stage) return;
    try {
      const r = await api<{ moved: boolean; statusChanged?: boolean }>("/api/dashboard/crm/pipeline", { method: "POST", body: JSON.stringify({ id: c.id, stage }) });
      setNotice(`Moved ${c.company} to ${stage}${r.statusChanged ? " and set its status to Customer" : ""}.`);
      await load();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <select aria-label="Service angle" style={{ ...inputStyle, width: "auto" }} value={angle} onChange={(e) => setAngle(e.target.value)}>
          <option value="">All service angles</option>
          {SERVICE_ANGLES.map((a) => <option key={a}>{a}</option>)}
        </select>
        <span style={{ ...muted, fontSize: 12 }}>Drag a card to another column, or use its Move menu.</span>
      </div>
      <ErrorLine msg={err} />
      {notice && <div style={card({ borderColor: alpha(T.ok, 40), color: T.ok, fontSize: 13, marginBottom: 12, padding: "10px 16px" })}>{notice}</div>}
      <div className="xscroll" style={{ display: "grid", gridTemplateColumns: `repeat(${DEAL_STAGES.length}, minmax(240px, 1fr))`, gap: 12, paddingBottom: 8 }}>
        {DEAL_STAGES.map((st) => {
          const t = d?.totals[st];
          const cards = d?.cards[st] ?? [];
          const won = st === "Closed Won";
          return (
            <div key={st}
              onDragOver={(e) => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver((o) => (o === st ? null : o))}
              onDrop={(e) => { e.preventDefault(); setOver(null); const c = Object.values(d?.cards ?? {}).flat().find((x) => x.id === dragId); if (c) move(c, st); setDragId(null); }}
              style={{ background: over === st ? alpha(T.brand, 14) : T.panel2, border: `1px solid ${over === st ? T.brand : T.border}`, borderRadius: 10, padding: 10, minHeight: 320, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "4px 4px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{st}</span>
                  <span className="dash-pill" style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 999, background: won ? T.brand : T.panel, color: won ? T.onBrand : T.textSub }}>{t ? t.count.toLocaleString() : "—"}</span>
                </div>
                <div style={{ fontFamily: DISP, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{t ? money(t.value) : "—"}</div>
              </div>
              {cards.map((c) => {
                const idle = idleDays(c.updated_at);
                return (
                  <div key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => { setDragId(null); setOver(null); }}
                    onClick={() => setOpenId(c.id)}
                    style={card({ padding: 12, cursor: "grab", opacity: dragId === c.id ? 0.5 : 1 })}>
                    <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{c.company}</div>
                    <div style={{ ...muted, fontSize: 12, marginTop: 2 }}>{[c.contact_name, [c.city, c.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "—"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{c.deal_value ? money(c.deal_value) : "—"}</span>
                      <span title="Days since this deal was last touched" style={{ fontSize: 11, color: idle > 14 ? T.warn : T.muted }}>{idle}d idle</span>
                    </div>
                    <select aria-label={`Move ${c.company}`} value="" onClick={(e) => e.stopPropagation()} onChange={(e) => { if (e.target.value) move(c, e.target.value); }}
                      style={{ ...inputStyle, marginTop: 8, height: 30, padding: "0 8px", fontSize: 12 }}>
                      <option value="">Move to…</option>
                      {DEAL_STAGES.filter((x) => x !== c.deal_stage).map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </div>
                );
              })}
              {t && cards.length < t.count && <button style={btn(false, { height: 30, fontSize: 12 })} onClick={() => more(st)}>Show more ({(t.count - cards.length).toLocaleString()} left)</button>}
              {d && !cards.length && <div style={{ ...muted, fontSize: 12, textAlign: "center", padding: 16 }}>No deals here.</div>}
            </div>
          );
        })}
      </div>
      {openId && <ProspectDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

interface CustomerRow { id: string; company: string; contact_name: string | null; email: string | null; primary_service: string | null; primary_sub_service: string | null; addon_services: string[]; deal_value: number; last_contact_at: string | null; next: { content: string; scheduled_at: string } | null }
interface PayClient { email: string | null; total_paid: number; open_amount: number; open_count: number; past_due: boolean; delinquent: boolean }

function CustomersView() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [pay, setPay] = useState<{ configured: boolean; clients: PayClient[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setRows((await api<{ customers: CustomerRow[] }>("/api/dashboard/crm/customers")).customers); setErr(null); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => {
    load();
    api<{ configured: boolean; clients: PayClient[] }>("/api/dashboard/payments").then(setPay).catch(() => setPay({ configured: false, clients: [] }));
  }, [load]);
  // Billing comes from Stripe, matched on the customer's email. No match → "Unknown"; never guessed.
  const billing = (r: CustomerRow): { text: string; tone: string } => {
    const m = r.email && pay?.clients.find((c) => c.email && c.email.toLowerCase() === r.email!.toLowerCase());
    if (!m) return { text: "Unknown", tone: T.muted };
    if (m.past_due || m.delinquent) return { text: `Past due ${money(m.open_amount / 100)}`, tone: T.danger };
    if (m.open_count) return { text: `Open invoice ${money(m.open_amount / 100)}`, tone: T.warn };
    return { text: `Paid up · ${money(m.total_paid / 100)} lifetime`, tone: T.ok };
  };
  const services = (r: CustomerRow) => [r.primary_sub_service || r.primary_service, ...(r.addon_services ?? [])].filter(Boolean).join(", ") || "—";

  return (
    <div>
      <ErrorLine msg={err} />
      <div style={{ ...muted, fontSize: 12, marginBottom: 12 }}>
        Prospects with status Customer. Moving a deal to Closed Won puts it here. {pay && !pay.configured ? "Billing shows Unknown until Stripe is connected." : "Billing is read from Stripe by email."}
      </div>
      <div className="xscroll" style={card({ padding: 0 })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 760 }}>
          <thead><tr>{["Company", "Services active", "Billing", "Last contact", "Next deliverable"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {(rows ?? []).map((r) => {
              const b = billing(r);
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setOpenId(r.id)}>
                  <td style={{ padding: 10, fontWeight: 600 }}>{r.company}<div style={{ ...muted, fontSize: 12, fontWeight: 400 }}>{r.contact_name ?? ""}</div></td>
                  <td style={{ padding: 10, color: T.textSub }}>{services(r)}</td>
                  <td style={{ padding: 10, color: b.tone, whiteSpace: "nowrap" }}>{b.text}</td>
                  <td style={{ padding: 10, color: T.textSub }}>{fmtDate(r.last_contact_at)}</td>
                  <td style={{ padding: 10, color: T.textSub }}>{r.next ? `${fmtDate(r.next.scheduled_at)} · ${r.next.content}` : "—"}</td>
                </tr>
              );
            })}
            {rows && !rows.length && <tr><td colSpan={5} style={{ ...muted, padding: 32, textAlign: "center" }}>No customers yet. Move a deal to Closed Won on the Pipeline and it shows up here.</td></tr>}
            {!rows && !err && <tr><td colSpan={5} style={{ ...muted, padding: 32, textAlign: "center" }}>Loading…</td></tr>}
          </tbody>
        </table>
      </div>
      {openId && <ProspectDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

// ─── Prospects list ─────────────────────────────────────────────────────────

const EMPTY_FILTERS: ListFilters = { q: "", status: [], category: "", state: "", tags: [], angle: "", sort: "company", dir: "asc", page: 1, pageSize: 50 };

function toQuery(f: ListFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.category) p.set("category", f.category);
  if (f.state) p.set("state", f.state);
  if (f.tags?.length) p.set("tags", f.tags.join(","));
  if (f.angle) p.set("angle", f.angle);
  if (f.has?.length) p.set("has", f.has.join(","));
  p.set("sort", f.sort ?? "company");
  p.set("dir", f.dir ?? "asc");
  p.set("page", String(f.page ?? 1));
  p.set("pageSize", String(f.pageSize ?? 50));
  return p.toString();
}

interface SavedView { id: string; name: string; filters: ListFilters }

const HAS_LABEL: Record<string, string> = { email: "Has email", phone: "Has phone", contacts: "Has decision makers" };

function ProspectsView({ initial }: { initial?: Partial<ListFilters> }) {
  const [filters, setFilters] = useState<ListFilters>({ ...EMPTY_FILTERS, ...initial });
  const [qInput, setQInput] = useState("");
  const [rows, setRows] = useState<Prospect[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [facets, setFacets] = useState<{ states: string[]; tags: string[]; categories: string[] }>({ states: [], tags: [], categories: [] });
  const [views, setViews] = useState<SavedView[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (f: ListFilters) => {
    setLoading(true); setErr(null);
    try {
      const d = await api<{ rows: Prospect[]; total: number }>(`/api/dashboard/crm/prospects?${toQuery(f)}`);
      setRows(d.rows); setTotal(d.total);
    } catch (e) { setErr((e as Error).message); setRows([]); setTotal(null); }
    finally { setLoading(false); }
  }, []);

  const loadMeta = useCallback(async () => {
    try { setFacets(await api("/api/dashboard/crm/prospects?facets=1")); } catch { /* list shows the error */ }
    try { setViews((await api<{ views: SavedView[] }>("/api/dashboard/crm/views")).views); } catch { /* optional */ }
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  // Debounced search box.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === qInput.trim() ? f : { ...f, q: qInput.trim(), page: 1 })), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const set = (patch: Partial<ListFilters>) => { setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 })); setSelected(new Set()); setAllMatching(false); };
  const pages = total ? Math.max(1, Math.ceil(total / (filters.pageSize ?? 50))) : 1;
  const categories = facets.categories.length ? facets.categories : [...CATEGORIES];
  const selCount = allMatching ? total ?? 0 : selected.size;

  const toggleStatus = (s: string) => set({ status: filters.status?.includes(s) ? filters.status.filter((x) => x !== s) : [...(filters.status ?? []), s] });

  const saveCurrentView = async () => {
    const name = window.prompt("Name this view");
    if (!name?.trim()) return;
    try { await api("/api/dashboard/crm/views", { method: "POST", body: JSON.stringify({ name, filters: { ...filters, page: 1 } }) }); loadMeta(); }
    catch (e) { setErr((e as Error).message); }
  };
  const deleteView = async (v: SavedView) => {
    if (!window.confirm(`Delete the saved view "${v.name}"? Prospects are not affected.`)) return;
    try { await api(`/api/dashboard/crm/views?id=${v.id}`, { method: "DELETE" }); loadMeta(); } catch (e) { setErr((e as Error).message); }
  };

  const runBulk = async () => {
    if (!bulkStatus && !bulkTag.trim()) return;
    const selection = allMatching ? { filters: { ...filters, page: 1 } } : { ids: [...selected] };
    setBusy(true); setErr(null); setNotice(null);
    try {
      const { count } = await api<{ count: number }>("/api/dashboard/crm/prospects/bulk", { method: "POST", body: JSON.stringify({ ...selection, count: true }) });
      const what = [bulkStatus && `set status to "${bulkStatus}"`, bulkTag.trim() && `add the tag "${bulkTag.trim()}"`].filter(Boolean).join(" and ");
      if (!window.confirm(`This will ${what} on ${count.toLocaleString()} prospects. It is logged and can be changed back. Continue?`)) return;
      const r = await api<{ updated: number }>("/api/dashboard/crm/prospects/bulk", { method: "POST", body: JSON.stringify({ ...selection, expectedCount: count, status: bulkStatus || undefined, addTag: bulkTag.trim() || undefined }) });
      setNotice(`Updated ${r.updated.toLocaleString()} prospects.`);
      setBulkStatus(""); setBulkTag(""); setSelected(new Set()); setAllMatching(false);
      load(filters); loadMeta();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const create = async () => {
    if (!newCompany.trim()) return;
    try {
      const { prospect } = await api<{ prospect: Prospect }>("/api/dashboard/crm/prospects", { method: "POST", body: JSON.stringify({ company: newCompany.trim() }) });
      setNewCompany(""); setAdding(false); setOpenId(prospect.id); load(filters);
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16 }}>Prospects</div>
          <div style={muted}>{total == null ? (loading ? "Loading…" : "—") : `${total.toLocaleString()} matching`}</div>
        </div>
        <button style={btn(true)} onClick={() => setAdding((a) => !a)}>Add prospect</button>
      </div>

      {adding && (
        <div style={card({ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" })}>
          <input autoFocus style={{ ...inputStyle, flex: "1 1 240px" }} placeholder="Company name" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
          <button style={btn(true)} onClick={create}>Create and open</button>
        </div>
      )}

      <div style={card({ marginBottom: 12 })}>
        <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Search company, contact, email, city, website or phone" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {(filters.has ?? []).map((h) => (
            <button key={h} className="dash-pill" aria-label={`Remove filter ${HAS_LABEL[h]}`} onClick={() => set({ has: (filters.has ?? []).filter((x) => x !== h) })} style={pill(true)}>{HAS_LABEL[h]} ✕</button>
          ))}
          {STATUSES.map((s) => {
            const on = filters.status?.includes(s);
            return <button key={s} className="dash-pill" aria-pressed={!!on} onClick={() => toggleStatus(s)} style={pill(!!on)}>{s}</button>;
          })}
        </div>
        <div className="m1col" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
          <select style={inputStyle} value={filters.category ?? ""} onChange={(e) => set({ category: e.target.value })} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select style={inputStyle} value={filters.state ?? ""} onChange={(e) => set({ state: e.target.value })} aria-label="State">
            <option value="">All states</option>
            {facets.states.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select style={inputStyle} value={filters.tags?.[0] ?? ""} onChange={(e) => set({ tags: e.target.value ? [e.target.value] : [] })} aria-label="Tag">
            <option value="">All tags</option>
            {facets.tags.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select style={inputStyle} value={filters.angle ?? ""} onChange={(e) => set({ angle: e.target.value })} aria-label="Service angle">
            <option value="">All service angles</option>
            {SERVICE_ANGLES.map((a) => <option key={a}>{a}</option>)}
          </select>
          <select style={inputStyle} value={`${filters.sort}:${filters.dir}`} onChange={(e) => { const [sort, dir] = e.target.value.split(":"); set({ sort: sort as ListFilters["sort"], dir: dir as "asc" | "desc" }); }} aria-label="Sort">
            <option value="company:asc">Company A–Z</option>
            <option value="company:desc">Company Z–A</option>
            <option value="lead_score:desc">Highest lead score</option>
            <option value="last_contact_at:desc">Recently contacted</option>
            <option value="last_contact_at:asc">Least recently contacted</option>
            <option value="updated_at:desc">Recently edited</option>
            <option value="created_at:desc">Newest first</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
          <span style={{ ...eyebrow, fontSize: 12 }}>Saved views</span>
          {views.map((v) => (
            <span key={v.id} style={{ display: "inline-flex", gap: 2 }}>
              <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12 })} onClick={() => { setQInput(v.filters.q ?? ""); set({ ...EMPTY_FILTERS, ...v.filters }); }}>{v.name}</button>
              <button aria-label={`Delete view ${v.name}`} style={btn(false, { height: 30, padding: "0 8px", fontSize: 12, color: T.muted })} onClick={() => deleteView(v)}>Delete</button>
            </span>
          ))}
          <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12 })} onClick={saveCurrentView}>Save current view</button>
          <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12, color: T.muted })} onClick={() => { setQInput(""); set(EMPTY_FILTERS); }}>Clear filters</button>
        </div>
      </div>

      <ErrorLine msg={err} />
      {notice && <div style={card({ borderColor: alpha(T.ok, 40), color: T.ok, fontSize: 13, marginBottom: 12 })}>{notice}</div>}

      {selCount > 0 && (
        <div style={card({ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderColor: alpha(T.accent, 40) })}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selCount.toLocaleString()} selected</span>
          {!allMatching && total != null && total > selected.size && (
            <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12 })} onClick={() => setAllMatching(true)}>Select all {total.toLocaleString()} matching</button>
          )}
          <select style={{ ...inputStyle, width: "auto" }} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} aria-label="Set status">
            <option value="">Set status…</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input style={{ ...inputStyle, width: 180 }} placeholder="Add tag" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} />
          <button style={btn(true)} disabled={busy} onClick={runBulk}>{busy ? "Working…" : "Apply to selected"}</button>
          <button style={btn(false)} onClick={() => { setSelected(new Set()); setAllMatching(false); }}>Clear selection</button>
        </div>
      )}

      <div className="xscroll" style={card({ padding: 0 })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ ...th, width: 32 }}>
                <input type="checkbox" aria-label="Select this page" checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                  onChange={(e) => { const s = new Set(selected); rows.forEach((r) => (e.target.checked ? s.add(r.id) : s.delete(r.id))); setSelected(s); setAllMatching(false); }} />
              </th>
              {["Company", "Contact", "Category", "Location", "Status", "Tags", "Last contact"].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setOpenId(r.id)}>
                <td style={{ padding: 10 }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${r.company}`} checked={allMatching || selected.has(r.id)}
                    onChange={(e) => { const s = new Set(selected); e.target.checked ? s.add(r.id) : s.delete(r.id); setSelected(s); setAllMatching(false); }} />
                </td>
                <td style={{ padding: 10, fontWeight: 600 }}>{r.company}</td>
                <td style={{ padding: 10 }}>
                  <div>{r.contact_name ?? "—"}</div>
                  <div style={{ ...muted, fontSize: 11 }}>{r.email ?? r.phone ?? ""}</div>
                </td>
                <td style={{ padding: 10, color: T.textSub }}>{r.category ?? "—"}</td>
                <td style={{ padding: 10, color: T.textSub }}>{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                <td style={{ padding: 10 }}><StatusPill status={r.status} /></td>
                <td style={{ padding: 10 }}>{(r.tags ?? []).length ? <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{(r.tags ?? []).slice(0, 3).map((t) => <span key={t} className="dash-pill" style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 999, background: T.brand, color: T.onBrand, whiteSpace: "nowrap" }}>{t}</span>)}{(r.tags ?? []).length > 3 && <span style={{ ...muted, fontSize: 11 }}>+{(r.tags ?? []).length - 3}</span>}</span> : <span style={{ color: T.muted }}>—</span>}</td>
                <td style={{ padding: 10, color: T.textSub }}>{fmtDate(r.last_contact_at)}</td>
              </tr>
            ))}
            {!rows.length && !loading && <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", ...muted }}>{err ? "Couldn't load prospects." : "No prospects match."}</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", marginTop: 10 }}>
        <span style={muted}>Page {filters.page} of {pages}</span>
        <button style={btn(false)} disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Previous</button>
        <button style={btn(false)} disabled={(filters.page ?? 1) >= pages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</button>
      </div>

      {openId && <ProspectDrawer id={openId} onClose={() => setOpenId(null)} onChanged={() => { load(filters); loadMeta(); }} />}
    </div>
  );
}

// ─── Prospect drawer ────────────────────────────────────────────────────────

type FieldKind = "text" | "textarea" | "number" | "date" | "tags" | { options: readonly string[] };
const DRAWER_FIELDS: { key: EditableField; label: string; kind: FieldKind }[] = [
  { key: "company", label: "Company", kind: "text" },
  { key: "contact_name", label: "Contact name", kind: "text" },
  { key: "contact_title", label: "Contact title", kind: "text" },
  { key: "email", label: "Email", kind: "text" },
  { key: "phone", label: "Phone", kind: "text" },
  { key: "city", label: "City", kind: "text" },
  { key: "state", label: "State", kind: "text" },
  { key: "zip", label: "ZIP", kind: "text" },
  { key: "website", label: "Website", kind: "text" },
  { key: "linkedin", label: "LinkedIn", kind: "text" },
  { key: "category", label: "Category", kind: { options: CATEGORIES } },
  { key: "status", label: "Status", kind: { options: STATUSES } },
  { key: "service_angle", label: "Service angle", kind: { options: SERVICE_ANGLES } },
  { key: "primary_service", label: "Offer group", kind: "text" },
  { key: "primary_sub_service", label: "Leading offer", kind: "text" },
  { key: "deal_stage", label: "Deal stage", kind: { options: DEAL_STAGES } },
  { key: "deal_value", label: "Deal value ($)", kind: "number" },
  { key: "lead_score", label: "Lead score (0–100)", kind: "number" },
  { key: "priority_call_rank", label: "Call queue rank", kind: "number" },
  { key: "tags", label: "Tags (comma separated)", kind: "tags" },
  { key: "source", label: "Source", kind: "text" },
  { key: "estimated_revenue", label: "Estimated revenue", kind: "text" },
  { key: "company_size", label: "Company size", kind: "text" },
  { key: "last_contact_at", label: "Last contact", kind: "date" },
  { key: "notes", label: "General notes", kind: "textarea" },
];

interface DrawerData {
  prospect: Prospect;
  contacts: { id: string; name: string | null; title: string | null; email: string | null; phone: string | null; linkedin: string | null; is_primary: boolean; confidence: string | null }[];
  notes: { id: string; type: string; content: string; created_at: string; scheduled_at?: string | null; completed_at?: string | null }[];
  activity: { id: string; action: string; summary: string; changes: Record<string, { from: unknown; to: unknown }> | null; created_at: string }[];
  merges: { id: string; company: string | null; reason: string | null; created_at: string }[];
}

const show = (v: unknown): string => (v == null || v === "" ? "—" : Array.isArray(v) ? (v.length ? v.join(", ") : "—") : String(v));

function ProspectDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<DrawerData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api<DrawerData>(`/api/dashboard/crm/prospects/${id}`)); setErr(null); }
    catch (e) { setErr((e as Error).message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !editing) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose]);

  const startEdit = (key: EditableField, kind: FieldKind) => {
    const v = data?.prospect[key as keyof Prospect];
    setEditing(key);
    setDraft(kind === "tags" ? ((v as string[]) ?? []).join(", ") : kind === "date" ? (v ? String(v).slice(0, 10) : "") : v == null ? "" : String(v));
  };

  const commit = async (key: EditableField, kind: FieldKind) => {
    setSaving(true);
    try {
      const value = kind === "tags" ? draft.split(",").map((t) => t.trim()).filter(Boolean)
        : kind === "number" ? (draft.trim() === "" ? null : Number(draft))
        : kind === "date" ? (draft ? new Date(`${draft}T12:00:00`).toISOString() : null)
        : draft;
      await api(`/api/dashboard/crm/prospects/${id}`, { method: "PATCH", body: JSON.stringify({ [key]: value }) });
      setEditing(null); await load(); onChanged();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  const [fuDate, setFuDate] = useState("");
  const [fuNote, setFuNote] = useState("");
  const scheduleFollowUp = async () => {
    if (!fuDate) { setErr("Pick a follow-up date"); return; }
    try {
      await api("/api/dashboard/crm/hitlist", { method: "POST", body: JSON.stringify({ action: "followup", prospectId: id, at: new Date(`${fuDate}T09:00:00`).toISOString(), content: fuNote }) });
      setFuDate(""); setFuNote(""); await load(); onChanged();
    } catch (e) { setErr((e as Error).message); }
  };
  const callList = async (op: "add" | "remove") => {
    try { await api("/api/dashboard/crm/hitlist", { method: "POST", body: JSON.stringify({ action: "rank", prospectId: id, op }) }); await load(); onChanged(); }
    catch (e) { setErr((e as Error).message); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try { await api(`/api/dashboard/crm/prospects/${id}/notes`, { method: "POST", body: JSON.stringify({ content: note }) }); setNote(""); load(); }
    catch (e) { setErr((e as Error).message); }
  };

  const p = data?.prospect;
  return (
    <div role="dialog" aria-label="Prospect details" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end", background: alpha("#000000", 55) }} onClick={onClose}>
      <div style={{ width: "min(620px, 100vw)", height: "100%", overflowY: "auto", background: T.surface, borderLeft: `1px solid ${T.border}`, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={eyebrow}>Prospect</div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 20 }}>{p?.company ?? "Loading…"}</div>
            {p && <div style={muted}>Added {fmtDate(p.created_at)} · edited {fmtDate(p.updated_at)}{p.legacy_id ? ` · Manus #${p.legacy_id}` : ""}</div>}
          </div>
          <button style={btn(false)} onClick={onClose}>Close</button>
        </div>
        <ErrorLine msg={err} />

        {p && (
          <>
            <div style={card({ marginBottom: 14 })}>
              {DRAWER_FIELDS.map(({ key, label: l, kind }) => {
                const v = p[key as keyof Prospect];
                const isEditing = editing === key;
                return (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.border}`, alignItems: "start" }}>
                    <span style={{ ...label, marginBottom: 0, paddingTop: 3 }}>{l}</span>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {typeof kind === "object" ? (
                          <select autoFocus style={{ ...inputStyle, flex: "1 1 200px" }} value={draft} onChange={(e) => setDraft(e.target.value)}>
                            <option value="">—</option>
                            {kind.options.map((o) => <option key={o}>{o}</option>)}
                            {draft && !kind.options.includes(draft) && <option>{draft}</option>}
                          </select>
                        ) : kind === "textarea" ? (
                          <textarea autoFocus rows={5} style={{ ...inputStyle, flex: "1 1 100%", resize: "vertical" }} value={draft} onChange={(e) => setDraft(e.target.value)} />
                        ) : (
                          <input autoFocus type={kind === "number" ? "number" : kind === "date" ? "date" : "text"} style={{ ...inputStyle, flex: "1 1 200px" }} value={draft}
                            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commit(key, kind); if (e.key === "Escape") setEditing(null); }} />
                        )}
                        <button style={btn(true)} disabled={saving} onClick={() => commit(key, kind)}>{saving ? "Saving…" : "Save"}</button>
                        <button style={btn(false)} onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button style={{ background: "none", border: "none", color: v == null || v === "" ? T.muted : T.text, textAlign: "left", cursor: "pointer", padding: 0, fontFamily: BODY, fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        title="Edit" onClick={() => startEdit(key, kind)}>
                        {key === "last_contact_at" ? fmtDate(v as string | null) : show(v)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ ...eyebrow, marginBottom: 8 }}>Follow-up and call list</div>
            <div style={card({ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" })}>
              <input type="date" aria-label="Follow-up date" style={{ ...inputStyle, width: 160 }} value={fuDate} onChange={(e) => setFuDate(e.target.value)} />
              <input aria-label="Follow-up note" placeholder="What to follow up on" style={{ ...inputStyle, flex: "1 1 180px", width: "auto" }} value={fuNote} onChange={(e) => setFuNote(e.target.value)} />
              <button style={btn(true)} onClick={scheduleFollowUp}>Set follow-up</button>
              {p.priority_call_rank != null
                ? <button style={btn(false)} onClick={() => callList("remove")}>On call list #{p.priority_call_rank} · Remove</button>
                : <button style={btn(false)} onClick={() => callList("add")}>Add to call list</button>}
            </div>

            <div style={{ ...eyebrow, marginBottom: 8 }}>Decision makers ({data!.contacts.length})</div>
            <div style={card({ marginBottom: 14 })}>
              {data!.contacts.length ? data!.contacts.map((c) => (
                <div key={c.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600 }}>{c.name ?? "—"}{c.is_primary ? " · primary" : ""}</div>
                  <div style={{ ...muted, fontSize: 11 }}>{[c.title, c.email, c.phone, c.linkedin, c.confidence && `confidence: ${c.confidence}`].filter(Boolean).join(" · ")}</div>
                </div>
              )) : <div style={muted}>None recorded.</div>}
            </div>

            <div style={{ ...eyebrow, marginBottom: 8 }}>Notes ({data!.notes.length})</div>
            <div style={card({ marginBottom: 14 })}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input style={inputStyle} placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button style={btn(true)} onClick={addNote}>Add note</button>
              </div>
              {data!.notes.map((n) => (
                <div key={n.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ ...muted, fontSize: 11 }}>{fmtDate(n.created_at)} · {n.type === "follow_up" ? `follow-up for ${fmtDate(n.scheduled_at)}${n.completed_at ? " · done" : ""}` : n.type}</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{n.content}</div>
                </div>
              ))}
            </div>

            <div style={{ ...eyebrow, marginBottom: 8 }}>Activity</div>
            <div style={card()}>
              {data!.merges.map((m) => <div key={m.id} style={{ ...muted, padding: "4px 0" }}>{fmtDate(m.created_at)} · merged in “{m.company}” ({m.reason})</div>)}
              {data!.activity.length ? data!.activity.map((a) => (
                <div key={a.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13 }}>{a.summary}</div>
                  <div style={{ ...muted, fontSize: 11 }}>{new Date(a.created_at).toLocaleString("en-US")}</div>
                  {a.changes && a.action === "updated" && Object.entries(a.changes).filter(([k]) => k !== "website_domain").map(([k, c]) => (
                    <div key={k} style={{ ...muted, fontSize: 11 }}>{k}: {show(c.from)} → {show(c.to)}</div>
                  ))}
                </div>
              )) : <div style={muted}>No changes since this record was added.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Import wizard ──────────────────────────────────────────────────────────

const VERDICT_LABEL: Record<Verdict, string> = { "new": "New", "duplicate-in-file": "Repeated in file", "duplicate-in-db": "Already in CRM", "invalid": "Invalid" };

interface ImportRow { id: string; filename: string | null; source: string | null; row_count: number; added: number; duplicates_in_file: number; duplicates_in_db: number; invalid: number; merge_candidates: unknown[]; created_at: string }

function ImportView() {
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [source, setSource] = useState("");
  const [verdicts, setVerdicts] = useState<RowVerdict[] | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [show, setShow] = useState<Verdict | "all">("all");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [history, setHistory] = useState<ImportRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    try { setHistory((await api<{ imports: ImportRow[] }>("/api/dashboard/crm/import")).imports); } catch { /* shown on action */ }
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null); setDone(null); setVerdicts(null); setSummary(null);
    const all = parseCsv(await f.text());
    if (all.length < 2) { setErr("That file has no data rows."); return; }
    setFilename(f.name); setHeaders(all[0]); setRows(all.slice(1)); setMapping(suggestMapping(all[0]));
  };

  const setCol = (key: EditableField, idx: string) => {
    setVerdicts(null); setSummary(null);
    setMapping((m) => { const n = { ...m }; if (idx === "") delete n[key]; else n[key] = Number(idx); return n; });
  };

  const send = async (action: "preview" | "commit") => {
    setBusy(true); setErr(null);
    try {
      const d = await api<{ verdicts?: RowVerdict[]; summary: Record<string, number>; added?: number; candidates?: number }>("/api/dashboard/crm/import", { method: "POST", body: JSON.stringify({ action, filename, source, rows, mapping }) });
      setSummary(d.summary);
      if (action === "preview") setVerdicts(d.verdicts ?? []);
      else {
        setDone(`Added ${d.added?.toLocaleString()} new prospects. ${d.candidates} possible duplicates were held back for review; repeated and invalid rows were skipped. The full report is saved below.`);
        setVerdicts(null); setRows([]); setHeaders([]); setFilename(""); if (fileRef.current) fileRef.current.value = "";
        loadHistory();
      }
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const confirmCommit = () => {
    if (!summary) return;
    if (window.confirm(`Add ${summary["new"]} new prospects? ${summary["duplicate-in-db"]} rows that match existing prospects will be held for review, and ${summary["duplicate-in-file"] + summary["invalid"]} repeated or invalid rows will be skipped.`)) send("commit");
  };

  const visible = useMemo(() => (verdicts ?? []).filter((v) => show === "all" || v.verdict === show).slice(0, 300), [verdicts, show]);
  const companyIdx = mapping.company;

  return (
    <div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Import CSV</div>
      <div style={{ ...muted, marginBottom: 12 }}>Upload, map columns, preview the dedupe report, then commit. Nothing is written until you commit, and only new rows are added.</div>
      <ErrorLine msg={err} />
      {done && <div style={card({ borderColor: alpha(T.ok, 40), color: T.ok, fontSize: 13, marginBottom: 12 })}>{done}</div>}

      <div style={card({ marginBottom: 12 })}>
        <span style={label}>1 · Choose a CSV file</span>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} style={{ color: T.text }} />
        {filename && <div style={{ ...muted, marginTop: 8 }}>{filename}: {rows.length.toLocaleString()} data rows, {headers.length} columns</div>}
      </div>

      {headers.length > 0 && (
        <div style={card({ marginBottom: 12 })}>
          <span style={label}>2 · Map columns</span>
          <div className="m1col" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {IMPORT_FIELDS.map((f) => (
              <div key={f.key}>
                <span style={{ ...label, color: f.key === "company" ? T.accent : T.muted }}>{f.label}{f.key === "company" ? " (required)" : ""}</span>
                <select style={inputStyle} value={mapping[f.key] ?? ""} onChange={(e) => setCol(f.key, e.target.value)}>
                  <option value="">— not imported —</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={label}>Source name (added as an “Imported: …” tag)</span>
            <input style={inputStyle} placeholder="e.g. Point of Rental list, Nov 2026" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <button style={{ ...btn(true), marginTop: 12 }} disabled={busy || companyIdx == null} onClick={() => send("preview")}>{busy ? "Checking…" : "Preview dedupe report"}</button>
        </div>
      )}

      {summary && verdicts && (
        <div style={card({ marginBottom: 12 })}>
          <span style={label}>3 · Dedupe report</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {(["all", "new", "duplicate-in-file", "duplicate-in-db", "invalid"] as const).map((v) => (
              <button key={v} style={{ ...btn(show === v, { padding: "5px 10px", fontSize: 12 }) }} onClick={() => setShow(v)}>
                {v === "all" ? `All ${summary.total}` : `${VERDICT_LABEL[v]} ${summary[v]}`}
              </button>
            ))}
          </div>
          <div className="xscroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
              <thead><tr style={{ textAlign: "left" }}>{["Row", "Company", "Verdict", "Why"].map((h) => <th key={h} style={{ ...eyebrow, fontSize: 10, padding: 8 }}>{h}</th>)}</tr></thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.row} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, ...muted }}>{v.row}</td>
                    <td style={{ padding: 8 }}>{companyIdx != null ? rows[v.row - 1]?.[companyIdx] || "—" : "—"}</td>
                    <td style={{ padding: 8, color: v.verdict === "new" ? T.ok : v.verdict === "invalid" ? T.danger : T.warn }}>{VERDICT_LABEL[v.verdict]}</td>
                    <td style={{ padding: 8, color: T.textSub }}>{v.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {verdicts.filter((v) => show === "all" || v.verdict === show).length > 300 && <div style={{ ...muted, marginTop: 6 }}>Showing the first 300 rows.</div>}
          <button style={{ ...btn(true), marginTop: 12 }} disabled={busy || !summary["new"]} onClick={confirmCommit}>{busy ? "Importing…" : `Add ${summary["new"]} new prospects`}</button>
        </div>
      )}

      <ManusLoadPanel onDone={loadHistory} />

      <div style={{ ...eyebrow, margin: "18px 0 8px" }}>Recent imports</div>
      <div style={card()}>
        {history.length ? history.map((h) => (
          <div key={h.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontWeight: 600 }}>{h.filename ?? "upload"}{h.source ? ` · ${h.source}` : ""}</div>
            <div style={{ ...muted, fontSize: 11 }}>{new Date(h.created_at).toLocaleString("en-US")} · {h.row_count} rows · {h.added} added · {h.duplicates_in_db} held as possible duplicates · {h.duplicates_in_file} repeated · {h.invalid} invalid</div>
          </div>
        )) : <div style={muted}>No imports yet.</div>}
      </div>
    </div>
  );
}

// ─── One-time Manus export load ─────────────────────────────────────────────
// Reads the Manus export JSON in the browser, shows what it holds, then sends
// it to the server in batches. Safe to run again: rows upsert on the Manus id.

type ManusParsed = ReturnType<typeof transformManusExport>;

function ManusLoadPanel({ onDone }: { onDone: () => void }) {
  const [parsed, setParsed] = useState<ManusParsed | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null); setResult(null); setProgress(null); setParsed(null);
    try {
      const exp = JSON.parse(await f.text()) as ManusExport;
      setFileName(f.name); setParsed(transformManusExport(exp));
    } catch {
      setErr("That file isn't readable JSON. Choose the Manus export file (manus-crm-export-….json).");
    }
  };

  const run = async () => {
    if (!parsed) return;
    const { stats } = parsed;
    if (!window.confirm(`Load ${stats.prospects.toLocaleString()} prospects, ${stats.contacts.toLocaleString()} decision makers and ${stats.notes} notes into the CRM? Running it again updates the same records instead of adding copies.`)) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const send = async (kind: string, rows: unknown[], label: string) => {
        for (let i = 0; i < rows.length; i += 250) {
          setProgress(`${label}: ${Math.min(i + 250, rows.length).toLocaleString()} of ${rows.length.toLocaleString()}`);
          await api("/api/dashboard/crm/manus-load", { method: "POST", body: JSON.stringify({ kind, rows: rows.slice(i, i + 250) }) });
        }
      };
      await send("prospects", parsed.prospects, "Prospects");
      await send("contacts", parsed.contacts, "Decision makers");
      await send("notes", parsed.notes, "Notes");
      setProgress("Checking counts…");
      const d = await api<{ ok: boolean; got: { prospects: number; contacts: number; notes: number; doNotContact: number } }>("/api/dashboard/crm/manus-load", { method: "POST", body: JSON.stringify({ kind: "finish", expected: { prospects: stats.prospects, contacts: stats.contacts, notes: stats.notes } }) });
      const line = `${d.got.prospects.toLocaleString()} prospects, ${d.got.contacts.toLocaleString()} decision makers and ${d.got.notes} notes are in the CRM (${d.got.doNotContact} Do Not Contact).`;
      setResult(d.ok ? `Loaded. ${line} Counts match the file.` : `Counts don't match the file: ${line} The file has ${stats.prospects}, ${stats.contacts} and ${stats.notes}.`);
      setProgress(null);
      onDone();
    } catch (e) {
      setErr(`Load stopped (${progress ?? "starting"}): ${(e as Error).message}. Running it again is safe; it picks up the same records.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={card({ marginTop: 18 })}>
      <div style={{ fontFamily: BODY, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Load Manus export</div>
      <div style={{ ...muted, marginBottom: 12 }}>One-time move of the Manus CRM: prospects, decision makers and notes, with their Manus ids kept. Repeats inside Manus are loaded as they are and can be merged on the Duplicates page.</div>
      <ErrorLine msg={err} />
      <input type="file" accept=".json,application/json" aria-label="Manus export file" onChange={(e) => onFile(e.target.files?.[0])} />
      {parsed && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>{fileName}: {parsed.stats.prospects?.toLocaleString()} prospects, {parsed.stats.contacts?.toLocaleString()} decision makers, {parsed.stats.notes} notes, {parsed.stats.doNotContact} Do Not Contact. Sequences ({parsed.stats.sequences}) are not loaded yet.</div>
          {parsed.problems.length > 0 ? (
            <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13 })}>
              {parsed.problems.length} problem(s), nothing will load:
              {parsed.problems.slice(0, 20).map((p) => <div key={p}>· {p}</div>)}
            </div>
          ) : (
            <button style={btn(true)} disabled={busy} onClick={run}>{busy ? "Loading…" : `Load ${parsed.stats.prospects?.toLocaleString()} prospects`}</button>
          )}
        </div>
      )}
      {progress && <div style={{ ...muted, marginTop: 8 }}>{progress}</div>}
      {result && <div style={{ marginTop: 10, fontSize: 13, color: result.startsWith("Loaded") ? T.ok : T.danger }}>{result}</div>}
    </div>
  );
}

// ─── Duplicates ─────────────────────────────────────────────────────────────

interface ClusterRow { reason: string; key: string; ids: string[]; rows: Prospect[] }

function DuplicatesView() {
  const [clusters, setClusters] = useState<ClusterRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [survivor, setSurvivor] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setErr(null);
    try { setClusters((await api<{ clusters: ClusterRow[] }>("/api/dashboard/crm/duplicates")).clusters); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const merge = async (c: ClusterRow) => {
    const sigKey = `${c.reason}:${c.key}`;
    const keep = survivor[sigKey] ?? c.rows[0]?.id;
    const keepRow = c.rows.find((r) => r.id === keep);
    const others = c.rows.filter((r) => r.id !== keep);
    if (!keepRow || !others.length) return;
    if (!window.confirm(`Merge ${others.length} record${others.length > 1 ? "s" : ""} into “${keepRow.company}”? Blank fields are filled, tags and notes are combined, contacts and notes move over, and each merged record is saved in the merge log before it is removed.`)) return;
    setBusy(sigKey); setErr(null);
    try {
      for (const o of others) await api("/api/dashboard/crm/duplicates", { method: "POST", body: JSON.stringify({ survivorId: keep, mergedId: o.id, reason: `${c.reason}: ${c.key}` }) });
      await load();
    } catch (e) { setErr((e as Error).message); await load(); }
    finally { setBusy(null); }
  };

  const reasons = Array.from(new Set((clusters ?? []).map((c) => c.reason)));
  const shown = (clusters ?? []).filter((c) => filter === "all" || c.reason === filter);
  const cols: { k: keyof Prospect; l: string }[] = [
    { k: "contact_name", l: "Contact" }, { k: "email", l: "Email" }, { k: "phone", l: "Phone" }, { k: "city", l: "City" },
    { k: "website", l: "Website" }, { k: "status", l: "Status" }, { k: "tags", l: "Tags" }, { k: "notes", l: "Notes" }, { k: "created_at", l: "Added" },
  ];

  return (
    <div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Duplicates</div>
      <div style={{ ...muted, marginBottom: 12 }}>Groups that share an email, website domain, company name or phone. Nothing merges on its own: pick the record to keep, then merge.</div>
      <ErrorLine msg={err} />
      {!clusters && !err && <div style={muted}>Scanning…</div>}
      {clusters && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button style={btn(filter === "all", { padding: "5px 10px", fontSize: 12 })} onClick={() => setFilter("all")}>All {clusters.length}</button>
          {reasons.map((r) => <button key={r} style={btn(filter === r, { padding: "5px 10px", fontSize: 12 })} onClick={() => setFilter(r)}>{r} {clusters.filter((c) => c.reason === r).length}</button>)}
          <button style={btn(false, { height: 30, padding: "0 10px", fontSize: 12 })} onClick={load}>Rescan</button>
        </div>
      )}
      {clusters && !shown.length && <div style={muted}>No duplicate groups found.</div>}
      {shown.slice(0, 100).map((c) => {
        const sigKey = `${c.reason}:${c.key}`;
        const keep = survivor[sigKey] ?? c.rows[0]?.id;
        return (
          <div key={sigKey} style={card({ marginBottom: 12 })}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div><span style={{ ...eyebrow, fontSize: 10 }}>{c.reason}</span> <span style={{ fontFamily: MONO, fontSize: 12 }}>{c.key}</span></div>
              <button style={btn(true)} disabled={busy === sigKey} onClick={() => merge(c)}>{busy === sigKey ? "Merging…" : `Merge into the kept record`}</button>
            </div>
            <div className="xscroll">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
                <thead><tr style={{ textAlign: "left" }}><th style={{ ...eyebrow, fontSize: 10, padding: 6 }}>Keep</th><th style={{ ...eyebrow, fontSize: 10, padding: 6 }}>Company</th>{cols.map((x) => <th key={x.k} style={{ ...eyebrow, fontSize: 10, padding: 6 }}>{x.l}</th>)}</tr></thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${T.border}`, background: r.id === keep ? alpha(T.accent, 8) : "transparent" }}>
                      <td style={{ padding: 6 }}><input type="radio" name={sigKey} aria-label={`Keep ${r.company}`} checked={r.id === keep} onChange={() => setSurvivor((s) => ({ ...s, [sigKey]: r.id }))} /></td>
                      <td style={{ padding: 6, fontWeight: 600 }}>{r.company}</td>
                      {cols.map((x) => <td key={x.k} style={{ padding: 6, color: T.textSub, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.k === "created_at" ? fmtDate(r.created_at) : show(r[x.k])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {shown.length > 100 && <div style={muted}>Showing the first 100 groups. Merge some, then rescan.</div>}
    </div>
  );
}
