"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Campaigns (C3): build one email for a saved CRM view, see exactly who gets
// it, pass the pre-launch checklist, send yourself a TEST, then submit. A
// submitted campaign is a Red approval in the Command Center; approving it is
// what launches it, and only if SEND_ENABLED is on.
// ─────────────────────────────────────────────────────────────────────────────

interface View { id: string; name: string }
interface CheckItem { key: string; label: string; ok: boolean; detail: string }
interface Checklist { ok: boolean; items: CheckItem[] }
interface Campaign {
  id: string; name: string; status: string; subject: string; audience: { view_name: string | null }; matched_count: number; recipient_count: number;
  pilot: boolean; pilot_size: number | null; daily_cap: number; start_at: string | null; checklist: Checklist | null; checked_at: string | null;
  approval_item_id: string | null; send_note: string | null; created_by: string | null; created_at: string;
}
interface ListData { campaigns: Campaign[]; views: View[]; send_enabled: boolean; pilot_required: boolean; hard_daily_max: number; defaults: { daily_cap: number; pilot_min: number; pilot_max: number } }
interface Preview {
  view_name: string | null; matched: number; with_email: number; recipient_count: number; pilot: boolean; pilot_required: boolean; pilot_size: number | null; daily_cap: number;
  first10: { company: string; first_name: string | null; email: string; city: string | null; state: string | null }[];
  sample: { subject: string; text: string } | null; checklist: Checklist;
}

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const input: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const h2: React.CSSProperties = { fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text, margin: 0 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: T.muted, marginBottom: 4, fontFamily: BODY };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 };

const STATUS: Record<string, { label: string; hue: string }> = {
  draft: { label: "Draft", hue: "#64748b" }, pending_approval: { label: "Waiting for approval", hue: "#d97706" }, queued: { label: "Approved, queued (not sending)", hue: "#2563eb" },
  sending: { label: "Sending", hue: "#16a34a" }, paused: { label: "Paused", hue: "#d97706" }, sent: { label: "Sent", hue: "#16a34a" }, killed: { label: "Killed", hue: "#dc2626" }, failed: { label: "Failed", hue: "#dc2626" },
};

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}
const post = <X,>(body: unknown) => api<X>("/api/dashboard/campaigns", { method: "POST", body: JSON.stringify(body) });

// "2026-11-20T09:30" read as Central time → an ISO instant.
function centralToIso(local: string): string | null {
  if (!local) return null;
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = (t ?? "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, day, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const get = (k: string) => Number(parts.find((p) => p.type === k)?.value);
  const asCentral = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess + (guess - asCentral)).toISOString();
}
const fmtCT = (s: string) => new Date(s).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " CT";

function ChecklistView({ c }: { c: Checklist }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {c.items.map((i) => (
        <li key={i.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
          <span aria-hidden style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: alpha(i.ok ? "#16a34a" : "#dc2626", 15), color: i.ok ? "#16a34a" : "#dc2626" }}>{i.ok ? "✓" : "✕"}</span>
          <span><span style={{ fontWeight: 500 }}>{i.label}</span><br /><span style={{ ...muted, color: i.ok ? T.muted : T.danger }}>{i.detail}</span></span>
        </li>
      ))}
    </ul>
  );
}

const EMPTY = { name: "", view_id: "", subject: "", body: "Hi {{first_name|there}},\n\n", pilot: true, pilot_size: 25, daily_cap: 40, start_local: "" };

export default function CampaignsTab() {
  const [data, setData] = useState<ListData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [building, setBuilding] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<ListData>("/api/dashboard/campaigns");
      setData(d); setLoadErr(null);
      setForm((f) => (f === EMPTY ? { ...f, daily_cap: d.defaults.daily_cap, pilot: d.pilot_required || f.pilot } : f));
    } catch (e) { setLoadErr(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const draft = () => ({ name: form.name, view_id: form.view_id, subject: form.subject, body: form.body, pilot: form.pilot, pilot_size: form.pilot_size, daily_cap: form.daily_cap, start_at: centralToIso(form.start_local) });
  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr(null); setMsg(null);
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  };
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => { setForm((f) => ({ ...f, [k]: v })); setPreview(null); };

  if (loadErr) return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13 })}>{loadErr}</div>;
  if (!data) return <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>Loading campaigns…</div>;

  return (
    <div>
      <div className="dash-in" style={card({ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderColor: data.send_enabled ? alpha("#16a34a", 40) : T.border })}>
        <span style={{ fontSize: 14, flex: 1, minWidth: 220 }}>
          {data.send_enabled
            ? "Sending is on. An approved campaign goes to Instantly and starts on its schedule."
            : "Sending is off (SEND_ENABLED isn't set). You can build, test and approve campaigns; approved ones queue and send nothing."}
        </span>
        {!building && <button style={btn(true)} onClick={() => { setBuilding(true); setForm({ ...EMPTY, daily_cap: data.defaults.daily_cap, pilot: true }); setPreview(null); }}>New campaign</button>}
      </div>

      {building && (
        <section className="dash-in" style={card({ marginBottom: 16 })}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}><h2 style={{ ...h2, flex: 1 }}>New campaign</h2><button style={btn(false, { height: 30, fontSize: 13 })} onClick={() => { setBuilding(false); setPreview(null); }}>Cancel</button></div>
          <div style={grid}>
            <label><span style={lbl}>Name</span><input style={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="DFW plumbers, November" /></label>
            <label><span style={lbl}>Audience (a saved CRM view)</span>
              <select style={input} value={form.view_id} onChange={(e) => set("view_id", e.target.value)}>
                <option value="">Pick a saved view…</option>
                {data.views.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label><span style={lbl}>Start (Central time, optional)</span><input style={input} type="datetime-local" value={form.start_local} onChange={(e) => set("start_local", e.target.value)} /></label>
            <label><span style={lbl}>Daily cap (limit {data.hard_daily_max})</span><input style={input} type="number" min={1} max={data.hard_daily_max} value={form.daily_cap} onChange={(e) => set("daily_cap", Number(e.target.value))} /></label>
          </div>
          {data.views.length === 0 && <p style={{ ...muted, marginTop: 8 }}>No saved views yet. Filter the CRM tab and save a view first; that view is the audience.</p>}
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" checked={form.pilot} disabled={data.pilot_required} onChange={(e) => set("pilot", e.target.checked)} />
              Pilot{data.pilot_required ? " (required for your first campaign)" : ""}
            </label>
            {form.pilot && <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              Send to the top
              <input style={{ ...input, width: 80 }} type="number" min={data.defaults.pilot_min} max={data.defaults.pilot_max} value={form.pilot_size} onChange={(e) => set("pilot_size", Number(e.target.value))} />
              prospects by lead score ({data.defaults.pilot_min}–{data.defaults.pilot_max})
            </label>}
          </div>
          <label style={{ display: "block", marginTop: 12 }}><span style={lbl}>Subject</span><input style={input} value={form.subject} onChange={(e) => set("subject", e.target.value)} /></label>
          <label style={{ display: "block", marginTop: 12 }}><span style={lbl}>Email (plain text; the signature, mailing address and unsubscribe link are added for you)</span>
            <textarea style={{ ...input, minHeight: 180, resize: "vertical", lineHeight: 1.5 }} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </label>
          <p style={{ ...muted, margin: "6px 0 0" }}>Fill-ins: {"{{first_name}}"}, {"{{company}}"}, {"{{city}}"}. Add a fallback after a bar for anyone missing it: {"{{first_name|there}}"}.</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button style={btn()} disabled={!!busy} onClick={() => act("preview", async () => setPreview(await post<Preview>({ op: "preview", ...draft() })))}>{busy === "preview" ? "Checking…" : "Preview and check"}</button>
            <button style={btn(true)} disabled={!!busy || !preview} title={preview ? undefined : "Run Preview and check first"} onClick={() => act("create", async () => {
              const r = await post<{ submitted: boolean; checklist: Checklist }>({ op: "create", ...draft() });
              if (r.submitted) { setMsg("Saved and sent to Approvals in the Command Center. Nothing goes out until Matt approves it."); setBuilding(false); setPreview(null); }
              else { setMsg("Saved as a draft. The checklist still has problems, shown below; fix them and re-check from the list."); setPreview((p) => (p ? { ...p, checklist: r.checklist } : p)); }
              await load();
            })}>{busy === "create" ? "Saving…" : preview?.checklist.ok ? "Save and send for approval" : "Save as draft"}</button>
          </div>

          {preview && (
            <div className="dash-in" style={{ marginTop: 16, display: "grid", gap: 16 }}>
              <div style={card({ background: T.surface })}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{preview.recipient_count} recipient{preview.recipient_count === 1 ? "" : "s"}</div>
                <div style={muted}>{preview.view_name} matches {preview.matched}; {preview.with_email} have an email{preview.matched - preview.with_email ? ` (${preview.matched - preview.with_email} without one are left out)` : ""}{preview.pilot ? `; pilot takes the top ${preview.pilot_size}` : ""}.</div>
                {preview.first10.length > 0 && <ol style={{ margin: "10px 0 0", paddingLeft: 20, fontSize: 14, display: "grid", gap: 2 }}>
                  {preview.first10.map((r, i) => <li key={i}>{r.company}{r.first_name ? `, ${r.first_name}` : ""} <span style={muted}>· {r.email}{r.city ? ` · ${r.city}${r.state ? `, ${r.state}` : ""}` : ""}</span></li>)}
                </ol>}
                {preview.recipient_count > 10 && <div style={{ ...muted, marginTop: 6 }}>The full list downloads from the campaign once it's saved.</div>}
              </div>
              <div style={card({ background: T.surface, borderColor: preview.checklist.ok ? alpha("#16a34a", 40) : alpha("#dc2626", 40) })}>
                <h2 style={{ ...h2, marginBottom: 10 }}>{preview.checklist.ok ? "Pre-launch checklist passes" : "Pre-launch checklist: fix these first"}</h2>
                <ChecklistView c={preview.checklist} />
              </div>
              {preview.sample && <div style={card({ background: T.surface })}>
                <div style={lbl}>How it reads for {preview.first10[0]?.company ?? "the first recipient"}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{preview.sample.subject}</div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{preview.sample.text}</pre>
              </div>}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 14 }}>Send one TEST to</span>
            <input style={{ ...input, width: 260 }} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@…" />
            <button style={btn()} disabled={!!busy || !testTo} onClick={() => act("test", async () => {
              const r = await post<{ subject: string; from: string }>({ op: "test", to: testTo, subject: form.subject, body: form.body });
              setMsg(`TEST sent to ${testTo} from ${r.from}: "${r.subject}".`);
            })}>{busy === "test" ? "Sending…" : "Send TEST"}</button>
          </div>
        </section>
      )}

      {(msg || err) && <div className="dash-in" style={card({ marginBottom: 16, fontSize: 14, color: err ? T.danger : T.text, borderColor: err ? alpha(T.danger, 40) : alpha("#16a34a", 40) })}>{err ?? msg}</div>}

      <h2 style={{ ...h2, margin: "8px 0 12px" }}>Campaigns</h2>
      {data.campaigns.length === 0 && <div style={card(muted)}>No campaigns yet.</div>}
      <div style={{ display: "grid", gap: 12 }}>
        {data.campaigns.map((c) => {
          const st = STATUS[c.status] ?? { label: c.status, hue: "#64748b" };
          const failing = c.checklist?.items.filter((i) => !i.ok) ?? [];
          return (
            <article key={c.id} className="dash-in" style={card()}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <div style={muted}>"{c.subject}" · {c.recipient_count} recipients from {c.audience?.view_name ?? "a filter"} · {c.daily_cap}/day{c.pilot ? " · pilot" : ""}{c.start_at ? ` · starts ${fmtCT(c.start_at)}` : ""}</div>
                </div>
                <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(st.hue, 12), color: st.hue, border: `1px solid ${alpha(st.hue, 30)}`, whiteSpace: "nowrap" }}>{st.label}</span>
              </div>
              {c.send_note && <p style={{ fontSize: 14, margin: "10px 0 0" }}>{c.send_note}</p>}
              {failing.length > 0 && c.status === "draft" && <div style={{ marginTop: 10 }}><ChecklistView c={{ ok: false, items: failing }} /></div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <a style={btn(false, { height: 30, fontSize: 13, textDecoration: "none" })} href={`/api/dashboard/campaigns?id=${c.id}&csv=1`}>Download list</a>
                {["draft", "killed", "failed"].includes(c.status) && <button style={btn(true, { height: 30, fontSize: 13 })} disabled={!!busy} onClick={() => act(`submit-${c.id}`, async () => { await post({ op: "submit", id: c.id }); setMsg(`"${c.name}" passed the checklist and is waiting for approval in the Command Center.`); await load(); })}>{busy === `submit-${c.id}` ? "Checking…" : "Re-check and send for approval"}</button>}
                {c.status === "sending" && <button style={btn(false, { height: 30, fontSize: 13 })} disabled={!!busy} onClick={() => act(`pause-${c.id}`, async () => { await post({ op: "pause", id: c.id }); await load(); })}>Pause</button>}
                {testTo && <button style={btn(false, { height: 30, fontSize: 13 })} disabled={!!busy} onClick={() => act(`test-${c.id}`, async () => { const r = await post<{ subject: string }>({ op: "test", to: testTo, campaign_id: c.id }); setMsg(`TEST of "${c.name}" sent to ${testTo}: "${r.subject}".`); })}>Send TEST to {testTo}</button>}
                {["draft", "killed", "failed"].includes(c.status) && <button style={btn(false, { height: 30, fontSize: 13, color: T.danger })} disabled={!!busy} onClick={() => { if (confirm(`Delete the draft "${c.name}"?`)) act(`del-${c.id}`, async () => { await post({ op: "delete", id: c.id }); await load(); }); }}>Delete</button>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
