"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T, alpha, BODY } from "./theme";
import { SkeletonList } from "./Skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Changelog: everything that's been done, by day, client and service. It reads
// the Activity log (dashboard actions, code shipped on GitHub, history and
// hand entries). Filters live in the address bar so a view can be bookmarked.
// ─────────────────────────────────────────────────────────────────────────────

interface Row {
  id: string; created_at: string; actor: string; action: string; target_type: string | null; summary: string;
  client: string | null; service: string | null; link: string | null; source: string;
}

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%", height: 36, boxSizing: "border-box" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const pill = (on: boolean): React.CSSProperties => ({
  fontFamily: BODY, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub,
});
function Chip({ text, hue }: { text: string; hue: string }) {
  return <span style={{ fontFamily: BODY, fontSize: 12, padding: "1px 8px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{text}</span>;
}

const SOURCE_LABEL: Record<string, string> = { dashboard: "Dashboard", github: "GitHub", manual: "Added by hand", history: "History" };
const TZ = "America/Chicago";
const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const today = () => dayKey(new Date().toISOString());
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d.toISOString()); };
const dayTitle = (k: string) => {
  const d = new Date(`${k}T12:00:00Z`);
  const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  if (k === today()) return `Today · ${label}`;
  if (k === daysAgo(1)) return `Yesterday · ${label}`;
  return label;
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

type Range = "today" | "7" | "30" | "all" | "custom";
const RANGES: [Range, string][] = [["today", "Today"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["all", "All time"], ["custom", "Pick dates"]];

interface Filters { range: Range; from: string; to: string; client: string; service: string; source: string; q: string; signIns: boolean }
const DEFAULTS: Filters = { range: "30", from: "", to: "", client: "", service: "", source: "", q: "", signIns: false };

function readUrl(): Filters {
  if (typeof window === "undefined") return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  const range = (p.get("range") as Range) || DEFAULTS.range;
  return {
    range: RANGES.some(([r]) => r === range) ? range : DEFAULTS.range,
    from: p.get("from") ?? "", to: p.get("to") ?? "", client: p.get("client") ?? "", service: p.get("service") ?? "",
    source: p.get("source") ?? "", q: p.get("q") ?? "", signIns: p.get("signins") === "1",
  };
}
function writeUrl(f: Filters) {
  const p = new URLSearchParams(window.location.search);
  for (const k of ["range", "from", "to", "client", "service", "source", "q", "signins"]) p.delete(k);
  if (f.range !== DEFAULTS.range) p.set("range", f.range);
  if (f.range === "custom") { if (f.from) p.set("from", f.from); if (f.to) p.set("to", f.to); }
  if (f.client) p.set("client", f.client);
  if (f.service) p.set("service", f.service);
  if (f.source) p.set("source", f.source);
  if (f.q) p.set("q", f.q);
  if (f.signIns) p.set("signins", "1");
  const qs = p.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
}

function query(f: Filters, offset: number, limit: number) {
  const p = new URLSearchParams();
  const span = f.range === "today" ? [today(), today()]
    : f.range === "7" ? [daysAgo(6), today()]
    : f.range === "30" ? [daysAgo(29), today()]
    : f.range === "custom" ? [f.from, f.to] : ["", ""];
  if (span[0]) p.set("from", span[0]);
  if (span[1]) p.set("to", span[1]);
  if (f.client) p.set("client", f.client);
  if (f.service) p.set("service", f.service);
  if (f.source) p.set("source", f.source);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.signIns) p.set("signins", "1");
  p.set("offset", String(offset));
  p.set("limit", String(limit));
  return p.toString();
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}

const csvCell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // keeps spreadsheets from running it as a formula
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function ChangelogPanel() {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [facets, setFacets] = useState<{ clients: string[]; services: string[] }>({ clients: [], services: [] });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0); // only the newest request may fill the list

  useEffect(() => { const u = readUrl(); setF(u); setSearch(u.q); setReady(true); }, []);
  const loadFacets = useCallback(() => {
    api<{ clients: string[]; services: string[] }>("/api/dashboard/cc/changelog?facets=1").then(setFacets).catch(() => {});
  }, []);
  useEffect(() => { loadFacets(); }, [loadFacets]);

  // Search waits for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => setF((cur) => (cur.q === search ? cur : { ...cur, q: search })), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (offset = 0) => {
    setErr(null); if (!offset) setBusy(true);
    const mine = ++seq.current;
    try {
      const r = await api<{ rows: Row[]; total: number }>(`/api/dashboard/cc/changelog?${query(f, offset, 100)}`);
      if (mine !== seq.current) return;
      setRows((prev) => (offset ? [...(prev ?? []), ...r.rows] : r.rows));
      setTotal(r.total);
    } catch (e) { if (mine === seq.current) setErr(`Couldn't load the changelog: ${(e as Error).message}`); }
    if (mine === seq.current) setBusy(false);
  }, [f]);
  useEffect(() => {
    if (!ready) return;
    writeUrl(f);
    load(0); // the old list stays, dimmed, until the new one arrives
  }, [f, ready, load]);

  const set = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));
  const filtered = f.client || f.service || f.source || f.q || f.signIns || f.range !== DEFAULTS.range;

  const days = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows ?? []) {
      const k = dayKey(r.created_at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return [...m.entries()];
  }, [rows]);

  async function exportCsv() {
    setExporting(true);
    try {
      const all: Row[] = [];
      for (let off = 0; off < 20000; off += 1000) {
        const r = await api<{ rows: Row[]; total: number }>(`/api/dashboard/cc/changelog?${query(f, off, 1000)}`);
        all.push(...r.rows);
        if (all.length >= r.total || r.rows.length === 0) break;
      }
      const head = ["Date", "Time (Central)", "Client", "Service", "What was done", "Who", "Source", "Link"];
      const lines = [head, ...all.map((r) => [dayKey(r.created_at), fmtTime(r.created_at), r.client, r.service, r.summary, r.actor, SOURCE_LABEL[r.source] ?? r.source, r.link])];
      const blob = new Blob([lines.map((l) => l.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `6signal-changelog-${today()}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { setErr(`Couldn't export: ${(e as Error).message}`); }
    setExporting(false);
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {RANGES.map(([r, l]) => <button key={r} className="dash-pill" style={pill(f.range === r)} onClick={() => set({ range: r })}>{l}</button>)}
      </div>
      {f.range === "custom" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <label style={muted}>From <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} style={{ ...inputStyle, width: 160, display: "inline-block", marginLeft: 6 }} /></label>
          <label style={muted}>To <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} style={{ ...inputStyle, width: 160, display: "inline-block", marginLeft: 6 }} /></label>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8, marginBottom: 10 }}>
        <input aria-label="Search the changelog" placeholder="Search what was done…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle} />
        <select aria-label="Client" value={f.client} onChange={(e) => set({ client: e.target.value })} style={inputStyle}>
          <option value="">All clients</option>
          {facets.clients.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="none">No client tagged</option>
        </select>
        <select aria-label="Service" value={f.service} onChange={(e) => set({ service: e.target.value })} style={inputStyle}>
          <option value="">All services</option>
          {facets.services.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="none">No service tagged</option>
        </select>
        <select aria-label="Where it came from" value={f.source} onChange={(e) => set({ source: e.target.value })} style={inputStyle}>
          <option value="">From anywhere</option>
          {Object.entries(SOURCE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <label style={{ ...muted, display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={f.signIns} onChange={(e) => set({ signIns: e.target.checked })} /> Show sign-ins
        </label>
        <div style={{ flex: 1 }} />
        {filtered && <button style={btn(false)} onClick={() => { setSearch(""); setF(DEFAULTS); }}>Clear filters</button>}
        <button style={btn(false)} disabled={exporting || !rows?.length} onClick={exportCsv}>{exporting ? "Exporting…" : "Download CSV"}</button>
        <button style={btn(true)} onClick={() => setAdding((a) => !a)}>{adding ? "Close" : "Add entry"}</button>
      </div>

      {adding && <AddEntry clients={facets.clients} services={facets.services} onDone={() => { setAdding(false); loadFacets(); load(0); }} />}

      {err && <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13, margin: "8px 0" })}>{err}</div>}
      {!rows && !err && <SkeletonList rows={8} label="Loading the changelog" />}
      {rows && (
        <div style={{ ...muted, marginBottom: 10 }}>
          {total.toLocaleString()} {total === 1 ? "entry" : "entries"}{filtered ? " match" : ""}
        </div>
      )}
      {rows && rows.length === 0 && <div style={card(muted)}>Nothing logged for these filters. Try a wider date range.</div>}

      <div className={busy ? "dash-busy" : "dash-settle"} aria-busy={busy}>
      {days.map(([k, list]) => (
        <section key={k} style={{ marginBottom: 18 }}>
          <h3 style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: T.textSub, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 6px" }}>
            {dayTitle(k)} <span style={{ fontWeight: 400, color: T.muted }}>· {list.length}</span>
          </h3>
          <div style={card({ padding: 0 })}>
            {list.map((r, i) => (
              <div key={r.id} style={{ padding: "10px 14px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontSize: 14, color: T.text, fontFamily: BODY, overflowWrap: "anywhere" }}>{r.summary}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                  {r.client && <Chip text={r.client} hue="#2563eb" />}
                  {r.service && <Chip text={r.service} hue="#7c3aed" />}
                  <span style={muted}>{r.actor} · {fmtTime(r.created_at)} · {SOURCE_LABEL[r.source] ?? r.source}</span>
                  {r.link && /^https:\/\//.test(r.link) && (
                    <a href={r.link} target="_blank" rel="noopener noreferrer" style={{ ...muted, color: T.accent, textDecoration: "underline" }}>Open</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      </div>

      {rows && rows.length < total && (
        <button style={btn(false)} disabled={more} onClick={async () => { setMore(true); await load(rows.length); setMore(false); }}>
          {more ? "Loading…" : `Show more (${(total - rows.length).toLocaleString()} left)`}
        </button>
      )}
    </div>
  );
}

function AddEntry({ clients, services, onDone }: { clients: string[]; services: string[]; onDone: () => void }) {
  const [summary, setSummary] = useState("");
  const [client, setClient] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState(today());
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function save() {
    setBusy(true); setErr(null);
    try {
      await api("/api/dashboard/cc/changelog", { method: "POST", body: JSON.stringify({ summary, client: client || null, service: service || null, date, link: link || null }) });
      onDone();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  return (
    <div style={card({ marginBottom: 16, display: "grid", gap: 8 })}>
      <textarea aria-label="What was done" placeholder="What was done? e.g. Updated X-Act's Google Business Profile hours" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} style={{ ...inputStyle, height: "auto", resize: "vertical" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        <select aria-label="Client" value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle}>
          <option value="">No client</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Service" value={service} onChange={(e) => setService(e.target.value)} style={inputStyle}>
          <option value="">No service</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input aria-label="Date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        <input aria-label="Link (optional)" placeholder="Link (optional), https://…" value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle} />
      </div>
      {err && <div style={{ color: T.danger, fontSize: 13, fontFamily: BODY }}>{err}</div>}
      <div><button style={btn(true)} disabled={busy || !summary.trim()} onClick={save}>{busy ? "Saving…" : "Save entry"}</button></div>
    </div>
  );
}
