"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T, alpha, MONO, DISP, BODY } from "./theme";
import {
  STATUSES, DEAL_STAGES, SERVICE_ANGLES, CATEGORIES, IMPORT_FIELDS, parseCsv, suggestMapping,
  Mapping, Prospect, ListFilters, RowVerdict, Verdict, EditableField,
} from "../lib/crmCore";

// ─────────────────────────────────────────────────────────────────────────────
// CRM (Phase C1): the Manus CRM's prospect database, rebuilt inside the
// Command Center. Prospects list with server-side search/filter/sort and saved
// views, a drawer showing every field with inline edit, a CSV import wizard
// that previews a dedupe report before anything is written, and a duplicates
// page where merges are chosen by a person and logged. Every write goes to the
// activity log. Self-contained inline styling, like the other dashboard tabs.
// ─────────────────────────────────────────────────────────────────────────────

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 16, ...extra });
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted };
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  background: primary ? T.accent : "transparent", color: primary ? "#060606" : T.text,
  border: `1px solid ${primary ? T.accent : T.border}`, borderRadius: 2, padding: "9px 14px",
  fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", ...extra,
});
const inputStyle: React.CSSProperties = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "9px 12px", borderRadius: 2, outline: "none", width: "100%" };
const label: React.CSSProperties = { ...eyebrow, fontSize: 10, marginBottom: 5, display: "block" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: MONO, fontSize: 12 };

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
  const [view, setView] = useState<"prospects" | "import" | "duplicates">("prospects");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {([["prospects", "Prospects"], ["import", "Import CSV"], ["duplicates", "Duplicates"]] as const).map(([id, l]) => (
          <button key={id} style={btn(view === id)} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>
      {view === "prospects" && <ProspectsView />}
      {view === "import" && <ImportView />}
      {view === "duplicates" && <DuplicatesView />}
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
  p.set("sort", f.sort ?? "company");
  p.set("dir", f.dir ?? "asc");
  p.set("page", String(f.page ?? 1));
  p.set("pageSize", String(f.pageSize ?? 50));
  return p.toString();
}

interface SavedView { id: string; name: string; filters: ListFilters }

function ProspectsView() {
  const [filters, setFilters] = useState<ListFilters>(EMPTY_FILTERS);
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
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18 }}>Prospects</div>
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
          {STATUSES.map((s) => {
            const on = filters.status?.includes(s);
            return <button key={s} onClick={() => toggleStatus(s)} style={{ ...btn(false, { padding: "5px 10px", fontSize: 12, fontFamily: BODY, fontWeight: 500 }), borderColor: on ? T.accent : T.border, color: on ? T.accent : T.textSub }}>{s}</button>;
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
          <span style={{ ...eyebrow, fontSize: 10 }}>Saved views</span>
          {views.map((v) => (
            <span key={v.id} style={{ display: "inline-flex", gap: 2 }}>
              <button style={btn(false, { padding: "5px 10px", fontSize: 12 })} onClick={() => { setQInput(v.filters.q ?? ""); set({ ...EMPTY_FILTERS, ...v.filters }); }}>{v.name}</button>
              <button aria-label={`Delete view ${v.name}`} style={btn(false, { padding: "5px 8px", fontSize: 12, color: T.muted })} onClick={() => deleteView(v)}>Delete</button>
            </span>
          ))}
          <button style={btn(false, { padding: "5px 10px", fontSize: 12 })} onClick={saveCurrentView}>Save current view</button>
          <button style={btn(false, { padding: "5px 10px", fontSize: 12, color: T.muted })} onClick={() => { setQInput(""); set(EMPTY_FILTERS); }}>Clear filters</button>
        </div>
      </div>

      <ErrorLine msg={err} />
      {notice && <div style={card({ borderColor: alpha(T.ok, 40), color: T.ok, fontSize: 13, marginBottom: 12 })}>{notice}</div>}

      {selCount > 0 && (
        <div style={card({ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderColor: alpha(T.accent, 40) })}>
          <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 13 }}>{selCount.toLocaleString()} selected</span>
          {!allMatching && total != null && total > selected.size && (
            <button style={btn(false, { padding: "5px 10px", fontSize: 12 })} onClick={() => setAllMatching(true)}>Select all {total.toLocaleString()} matching</button>
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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 10, width: 32 }}>
                <input type="checkbox" aria-label="Select this page" checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                  onChange={(e) => { const s = new Set(selected); rows.forEach((r) => (e.target.checked ? s.add(r.id) : s.delete(r.id))); setSelected(s); setAllMatching(false); }} />
              </th>
              {["Company", "Contact", "Category", "Location", "Status", "Tags", "Last contact"].map((h) => <th key={h} style={{ ...eyebrow, fontSize: 10, padding: 10 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }} onClick={() => setOpenId(r.id)}>
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
                <td style={{ padding: 10 }}><span style={{ color: r.status === "Do Not Contact" ? T.danger : T.text }}>{r.status}</span></td>
                <td style={{ padding: 10, color: T.textSub, fontSize: 12 }}>{(r.tags ?? []).join(", ") || "—"}</td>
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
  notes: { id: string; type: string; content: string; created_at: string }[];
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
                  <div style={{ ...muted, fontSize: 11 }}>{fmtDate(n.created_at)} · {n.type}</div>
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
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Import CSV</div>
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
      <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Duplicates</div>
      <div style={{ ...muted, marginBottom: 12 }}>Groups that share an email, website domain, company name or phone. Nothing merges on its own: pick the record to keep, then merge.</div>
      <ErrorLine msg={err} />
      {!clusters && !err && <div style={muted}>Scanning…</div>}
      {clusters && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button style={btn(filter === "all", { padding: "5px 10px", fontSize: 12 })} onClick={() => setFilter("all")}>All {clusters.length}</button>
          {reasons.map((r) => <button key={r} style={btn(filter === r, { padding: "5px 10px", fontSize: 12 })} onClick={() => setFilter(r)}>{r} {clusters.filter((c) => c.reason === r).length}</button>)}
          <button style={btn(false, { padding: "5px 10px", fontSize: 12 })} onClick={load}>Rescan</button>
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
