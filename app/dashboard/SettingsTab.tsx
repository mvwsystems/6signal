"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Settings (C3): the sender profile, compliance footer, campaign limits,
// protected territories, claimed markets, the sending engine's status, the
// team, and the CRM's status lists. Matt edits; Casey sees it read-only.
// Each section saves on its own and every save is logged to Activity.
// ─────────────────────────────────────────────────────────────────────────────

interface Signature { name: string; title: string; company: string; phone: string }
interface Sending { from_name: string; from_address: string; reply_to: string; signature: Signature }
interface Compliance { mailing_address: string; booking_link: string }
interface Defaults { daily_cap: number; pilot_min: number; pilot_max: number; send_window_from: string; send_window_to: string; send_days: number[] }
interface Territory { id: string; name: string; center_city: string; center_state: string; lat: number | null; lng: number | null; radius_miles: number; trade: string; reason: string | null; active: boolean }
interface Claimed { id: string; client: string; city: string; state: string; trade: string; note: string | null; active: boolean }
interface Conn { name: string; status: string; note: string | null; last_sync_at: string | null; last_error: string | null }
interface Data {
  sending: Sending; compliance: Compliance; campaign_defaults: Defaults; updated: Record<string, { by: string | null; at: string }>;
  territories: Territory[]; claimed: Claimed[];
  config: { send_enabled: boolean; hard_daily_max: number; instantly_key: boolean; resend_key: boolean; places_key: boolean; email_from: string | null; gmail_key?: boolean; gmail_mailbox?: string };
  connections: Conn[]; team: { owners: string[]; operators: string[] };
  lists: { statuses: string[]; deal_stages: string[]; service_angles: string[]; categories: string[] };
  can_edit: boolean;
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
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Dot({ status }: { status: string }) {
  const hue = status === "connected" ? "#16a34a" : status === "degraded" ? "#d97706" : status === "down" ? "#dc2626" : "#64748b";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: hue, marginRight: 8 }} />;
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}
const post = (body: unknown) => api("/api/dashboard/settings", { method: "POST", body: JSON.stringify(body) });

// The inbox's Gmail connection: casey@ signs in with Google once and allows
// read + create drafts. Owner only; the token never reaches the browser.
const GMAIL_NOTICE: Record<string, { text: string; ok?: boolean }> = {
  connected: { text: "Gmail connected. The inbox reads new mail every 15 minutes.", ok: true },
  wrong_account: { text: "That wasn't the inbox mailbox, so nothing was saved. Pick the inbox account on Google's screen." },
  missing_scopes: { text: "Google didn't grant both permissions (read and create drafts), so nothing was saved. Try again and allow both." },
  no_refresh_token: { text: "Google didn't return lasting access, so nothing was saved. Try again." },
  cancelled: { text: "Connecting Gmail was cancelled. Nothing changed." },
  owner_only: { text: "Only Matt can connect or disconnect Gmail." },
  google_not_set_up: { text: "Google sign-in isn't set up on this site (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)." },
  failed: { text: "Connecting Gmail didn't work. Nothing was saved. Try again." },
};
interface GmailStatus { mailbox: string; client_ready: boolean; connected: boolean; needs_reconnect?: boolean; connected_at: string | null; connected_by: string | null; status: string | null; last_error: string | null; last_sync_at: string | null }

function GmailConnect({ canEdit }: { canEdit: boolean }) {
  const [g, setG] = useState<GmailStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok?: boolean } | null>(null);
  const load = useCallback(() => { api<GmailStatus>("/api/dashboard/gmail").then(setG).catch((e) => setNote({ text: (e as Error).message })); }, []);
  useEffect(() => {
    load();
    // Google sends the browser back with ?gmail=<result>; show it once, then tidy the address bar.
    const sp = new URLSearchParams(window.location.search);
    const r = sp.get("gmail");
    if (r) {
      setNote(GMAIL_NOTICE[r] ?? GMAIL_NOTICE.failed);
      sp.delete("gmail");
      const qs = sp.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    }
  }, [load]);
  const disconnect = async () => {
    if (!g || !confirm(`Disconnect ${g.mailbox} from the inbox? The inbox stops reading new mail until it's connected again.`)) return;
    setBusy(true);
    try { await api("/api/dashboard/gmail", { method: "POST", body: JSON.stringify({ op: "disconnect" }) }); setNote({ text: "Gmail disconnected.", ok: true }); load(); }
    catch (e) { setNote({ text: (e as Error).message }); } finally { setBusy(false); }
  };
  const mailbox = g?.mailbox ?? "casey@6signal.co";
  const dot = !g ? "not_configured" : !g.connected ? "not_configured" : g.status === "down" ? "down" : "connected";
  const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null);
  return (
    <div>
      {g?.needs_reconnect && (
        <div role="alert" style={{ color: T.danger, fontWeight: 600, marginBottom: 6 }}>Google access for {mailbox} expired or was removed. Press Reconnect, sign in to Google as {mailbox} and press Allow.</div>
      )}
      <div><Dot status={dot} />Inbox (Gmail, {mailbox}): {!g ? "checking…" : g.connected
        ? <>connected{g.connected_at ? ` ${when(g.connected_at)}` : ""}{g.connected_by ? ` by ${g.connected_by}` : ""}; reads mail and creates drafts, never sends.{g.last_sync_at ? ` Last read ${when(g.last_sync_at)}.` : " First read runs within 15 minutes."}{g.last_error ? <span style={{ color: T.danger }}> Last error: {g.last_error}</span> : null}</>
        : <>not connected. {canEdit ? `Press Connect, then sign in to Google as ${mailbox} and press Allow.` : "Matt connects it here."}</>}
      </div>
      {canEdit && g && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          {!g.connected && <a href="/api/dashboard/gmail/connect" style={{ ...btn(true), textDecoration: "none", opacity: g.client_ready ? 1 : 0.5, pointerEvents: g.client_ready ? "auto" : "none" }}>Connect {mailbox}</a>}
          {g.connected && <a href="/api/dashboard/gmail/connect" style={{ ...btn(!!g.needs_reconnect), textDecoration: "none" }}>Reconnect</a>}
          {g.connected && <button style={btn(false, { color: T.danger })} disabled={busy} onClick={disconnect}>{busy ? "Disconnecting…" : "Disconnect"}</button>}
          {!g.client_ready && <span style={muted}>Google sign-in isn't set up on this site, so Gmail can't be connected yet.</span>}
        </div>
      )}
      {note && <div style={{ fontSize: 13, marginTop: 8, color: note.ok ? T.ok : T.danger }}>{note.text}</div>}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label style={{ display: "block" }}><span style={lbl}>{label}</span>{children}{hint && <span style={{ ...muted, fontSize: 12, display: "block", marginTop: 4 }}>{hint}</span>}</label>;
}

function Section({ title, sub, children, onSave, saving, msg, err, canEdit }: {
  title: string; sub?: string; children: React.ReactNode; onSave?: () => void; saving?: boolean; msg?: string | null; err?: string | null; canEdit: boolean;
}) {
  return (
    <section className="dash-in" style={card({ marginBottom: 16 })}>
      <div style={{ marginBottom: 12 }}><h2 style={h2}>{title}</h2>{sub && <p style={{ ...muted, margin: "4px 0 0" }}>{sub}</p>}</div>
      <fieldset disabled={!canEdit} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
      {(onSave && canEdit) || msg || err ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          {onSave && canEdit && <button style={btn(true)} onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>}
          {msg && <span style={{ ...muted, color: "#16a34a" }}>{msg}</span>}
          {err && <span style={{ ...muted, color: T.danger }}>{err}</span>}
        </div>
      ) : null}
    </section>
  );
}

function useSaver(reload: () => Promise<void>) {
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string | null>>({});
  const [err, setErr] = useState<Record<string, string | null>>({});
  const run = async (key: string, fn: () => Promise<unknown>, done = "Saved.") => {
    setSaving(key); setMsg((m) => ({ ...m, [key]: null })); setErr((e) => ({ ...e, [key]: null }));
    try { await fn(); setMsg((m) => ({ ...m, [key]: done })); await reload(); }
    catch (e) { setErr((x) => ({ ...x, [key]: e instanceof Error ? e.message : String(e) })); }
    finally { setSaving(null); }
  };
  return { saving, msg, err, run };
}

export default function SettingsTab() {
  const [data, setData] = useState<Data | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sending, setSending] = useState<Sending | null>(null);
  const [compliance, setCompliance] = useState<Compliance | null>(null);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [terr, setTerr] = useState({ center_city: "", center_state: "TX", radius_miles: "15", trade: "", reason: "" });
  const [claim, setClaim] = useState({ client: "", city: "", state: "TX", trade: "", note: "" });
  const [inst, setInst] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<Data>("/api/dashboard/settings");
      setData(d); setSending(d.sending); setCompliance(d.compliance); setDefaults(d.campaign_defaults); setLoadErr(null);
    } catch (e) { setLoadErr(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const { saving, msg, err, run } = useSaver(load);

  if (loadErr) return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13 })}>{loadErr}</div>;
  if (!data || !sending || !compliance || !defaults) return <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>Loading settings…</div>;
  const can = data.can_edit;
  const sig = sending.signature;
  const setSig = (k: keyof Signature, v: string) => setSending({ ...sending, signature: { ...sig, [k]: v } });
  const instConn = data.connections.find((c) => c.name === "instantly");
  const stamp = (k: string) => data.updated[k] ? `Last changed by ${data.updated[k].by ?? "someone"} on ${new Date(data.updated[k].at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.` : undefined;

  return (
    <div>
      {!can && <div style={card({ marginBottom: 16, ...muted })}>You can see these settings. Only Matt can change them.</div>}

      <Section title="Sending" sub={`Who campaign emails come from and the signature under every one. ${stamp("sending") ?? ""}`} canEdit={can}
        onSave={() => run("sending", () => post({ op: "save", key: "sending", value: sending }))} saving={saving === "sending"} msg={msg.sending} err={err.sending}>
        <div style={grid}>
          <Field label="From name"><input style={input} value={sending.from_name} onChange={(e) => setSending({ ...sending, from_name: e.target.value })} /></Field>
          <Field label="From address" hint="The mailbox connected in Instantly. Campaigns can't launch while it's blank."><input style={input} type="email" value={sending.from_address} onChange={(e) => setSending({ ...sending, from_address: e.target.value })} placeholder="casey@…" /></Field>
          <Field label="Reply-to"><input style={input} type="email" value={sending.reply_to} onChange={(e) => setSending({ ...sending, reply_to: e.target.value })} /></Field>
        </div>
        <div style={{ ...grid, marginTop: 12 }}>
          <Field label="Signature name"><input style={input} value={sig.name} onChange={(e) => setSig("name", e.target.value)} /></Field>
          <Field label="Signature title"><input style={input} value={sig.title} onChange={(e) => setSig("title", e.target.value)} /></Field>
          <Field label="Signature company"><input style={input} value={sig.company} onChange={(e) => setSig("company", e.target.value)} /></Field>
          <Field label="Signature phone" hint="A 555 number or placeholder text is refused."><input style={input} value={sig.phone} onChange={(e) => setSig("phone", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Compliance" sub={`The CAN-SPAM footer on every campaign email. ${stamp("compliance") ?? ""}`} canEdit={can}
        onSave={() => run("compliance", () => post({ op: "save", key: "compliance", value: compliance }))} saving={saving === "compliance"} msg={msg.compliance} err={err.compliance}>
        <div style={grid}>
          <Field label="Mailing address" hint={compliance.mailing_address ? undefined : "Blank: no campaign can launch until this is filled in."}>
            <input style={input} value={compliance.mailing_address} onChange={(e) => setCompliance({ ...compliance, mailing_address: e.target.value })} placeholder="Street, city, state ZIP" />
          </Field>
          <Field label="Booking link (optional, goes under the signature)"><input style={input} value={compliance.booking_link} onChange={(e) => setCompliance({ ...compliance, booking_link: e.target.value })} placeholder="https://" /></Field>
        </div>
        <p style={{ ...muted, margin: "10px 0 0" }}>Every email also gets its own unsubscribe link, which marks the prospect Do Not Contact.</p>
      </Section>

      <Section title="Campaign limits" sub={`Defaults for new campaigns. The daily cap can't go over ${data.config.hard_daily_max}, the limit set in Netlify.`} canEdit={can}
        onSave={() => run("defaults", () => post({ op: "save", key: "campaign_defaults", value: defaults }))} saving={saving === "defaults"} msg={msg.defaults} err={err.defaults}>
        <div style={grid}>
          <Field label="Daily cap"><input style={input} type="number" min={1} max={data.config.hard_daily_max} value={defaults.daily_cap} onChange={(e) => setDefaults({ ...defaults, daily_cap: Number(e.target.value) })} /></Field>
          <Field label="Pilot size, smallest"><input style={input} type="number" min={5} max={50} value={defaults.pilot_min} onChange={(e) => setDefaults({ ...defaults, pilot_min: Number(e.target.value) })} /></Field>
          <Field label="Pilot size, largest"><input style={input} type="number" min={5} max={50} value={defaults.pilot_max} onChange={(e) => setDefaults({ ...defaults, pilot_max: Number(e.target.value) })} /></Field>
          <Field label="Send window (Central)">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input style={input} type="time" value={defaults.send_window_from} onChange={(e) => setDefaults({ ...defaults, send_window_from: e.target.value })} />
              <span style={muted}>to</span>
              <input style={input} type="time" value={defaults.send_window_to} onChange={(e) => setDefaults({ ...defaults, send_window_to: e.target.value })} />
            </div>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {DAYS.map((d, i) => {
            const on = defaults.send_days.includes(i);
            return <button key={d} type="button" aria-pressed={on} onClick={() => setDefaults({ ...defaults, send_days: on ? defaults.send_days.filter((x) => x !== i) : [...defaults.send_days, i].sort() })}
              style={{ ...btn(on, { height: 30, padding: "0 12px", fontSize: 13 }) }}>{d}</button>;
          })}
        </div>
      </Section>

      <Section title="Protected territories" sub="No campaign can reach a prospect in this trade inside the radius." canEdit={can} msg={msg.terr} err={err.terr}>
        {data.territories.length === 0 && <p style={muted}>None yet.</p>}
        {data.territories.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{t.radius_miles} mi around {t.center_city}, {t.center_state} · {t.trade}</div>
              <div style={muted}>{t.reason || t.name}{t.lat == null ? " · centre not found on the map, so every prospect in this trade is held back" : ""}{t.active ? "" : " · switched off"}</div>
            </div>
            {can && <button style={btn(false, { height: 30, fontSize: 13 })} onClick={() => run("terr", () => post({ ...t, op: "territory", active: !t.active }), t.active ? "Switched off." : "Switched on.")}>{t.active ? "Switch off" : "Switch on"}</button>}
            {can && <button style={btn(false, { height: 30, fontSize: 13, color: T.danger })} onClick={() => { if (confirm(`Remove the ${t.center_city} ${t.trade} territory?`)) run("terr", () => post({ op: "territory_delete", id: t.id }), "Removed."); }}>Remove</button>}
          </div>
        ))}
        {can && (
          <div style={{ ...grid, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <Field label="Centre city"><input style={input} value={terr.center_city} onChange={(e) => setTerr({ ...terr, center_city: e.target.value })} /></Field>
            <Field label="State"><input style={input} maxLength={2} value={terr.center_state} onChange={(e) => setTerr({ ...terr, center_state: e.target.value.toUpperCase() })} /></Field>
            <Field label="Radius (miles)"><input style={input} type="number" min={1} max={500} value={terr.radius_miles} onChange={(e) => setTerr({ ...terr, radius_miles: e.target.value })} /></Field>
            <Field label="Trade"><input style={input} value={terr.trade} onChange={(e) => setTerr({ ...terr, trade: e.target.value })} placeholder="plumbing" /></Field>
            <Field label="Reason"><input style={input} value={terr.reason} onChange={(e) => setTerr({ ...terr, reason: e.target.value })} placeholder="Client exclusivity" /></Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}><button style={btn(true)} disabled={saving === "terr"} onClick={() => run("terr", async () => { await post({ op: "territory", ...terr }); setTerr({ center_city: "", center_state: "TX", radius_miles: "15", trade: "", reason: "" }); }, "Added.")}>Add territory</button></div>
          </div>
        )}
      </Section>

      <Section title="Claimed markets" sub="A client's city and trade. No campaign can reach a prospect in the same trade in that city." canEdit={can} msg={msg.claim} err={err.claim}>
        {data.claimed.length === 0 && <p style={muted}>None yet.</p>}
        {data.claimed.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.border}`, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{m.trade} in {m.city}, {m.state}</div>
              <div style={muted}>{m.client}{m.note ? ` · ${m.note}` : ""}{m.active ? "" : " · switched off"}</div>
            </div>
            {can && <button style={btn(false, { height: 30, fontSize: 13, color: T.danger })} onClick={() => { if (confirm(`Remove ${m.client}'s claim on ${m.trade} in ${m.city}?`)) run("claim", () => post({ op: "claimed_delete", id: m.id }), "Removed."); }}>Remove</button>}
          </div>
        ))}
        {can && (
          <div style={{ ...grid, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <Field label="Client"><input style={input} value={claim.client} onChange={(e) => setClaim({ ...claim, client: e.target.value })} /></Field>
            <Field label="City"><input style={input} value={claim.city} onChange={(e) => setClaim({ ...claim, city: e.target.value })} /></Field>
            <Field label="State"><input style={input} maxLength={2} value={claim.state} onChange={(e) => setClaim({ ...claim, state: e.target.value.toUpperCase() })} /></Field>
            <Field label="Trade"><input style={input} value={claim.trade} onChange={(e) => setClaim({ ...claim, trade: e.target.value })} placeholder="plumbing" /></Field>
            <div style={{ display: "flex", alignItems: "flex-end" }}><button style={btn(true)} disabled={saving === "claim"} onClick={() => run("claim", async () => { await post({ op: "claimed", ...claim }); setClaim({ client: "", city: "", state: "TX", trade: "", note: "" }); }, "Added.")}>Add claimed market</button></div>
          </div>
        )}
      </Section>

      <Section title="Sending engine" sub="Instantly sends campaigns. Nothing sends unless SEND_ENABLED is true in Netlify, which only you set." canEdit={can} msg={msg.inst} err={err.inst}>
        <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
          <div><Dot status={data.config.send_enabled ? "connected" : "not_configured"} />Sending switch (SEND_ENABLED): <strong>{data.config.send_enabled ? "on" : "off, so approved campaigns queue and send nothing"}</strong></div>
          <div><Dot status={instConn?.status ?? "not_configured"} />Instantly: {data.config.instantly_key ? (instConn?.note ?? "key is set; press Test to check it") : "no API key set (INSTANTLY_API_KEY)"}{instConn?.last_error ? ` · last error: ${instConn.last_error}` : ""}</div>
          <div><Dot status={data.config.resend_key ? "connected" : "not_configured"} />Test sends (Resend): {data.config.resend_key ? `ready${data.config.email_from ? `, from ${data.config.email_from}` : ""}` : "no RESEND_API_KEY set"}</div>
          <GmailConnect canEdit={can} />
          <div><Dot status={data.config.places_key ? "connected" : "not_configured"} />Map lookups for territories (Google Places): {data.config.places_key ? "ready" : "no key, so towns not already on file can't be checked"}</div>
        </div>
        {can && data.config.instantly_key && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <button style={btn()} disabled={saving === "inst"} onClick={() => run("inst", async () => {
              const r = await post({ op: "test_instantly" }) as { ok: boolean; error?: string; workspace?: string; accounts?: { email: string; active: boolean }[] };
              setInst(r.ok ? `Key works. Workspace ${r.workspace ?? ""}, ${r.accounts?.length ?? 0} sending account${r.accounts?.length === 1 ? "" : "s"}.` : `Didn't work: ${r.error}`);
            }, "Checked.")}>{saving === "inst" ? "Testing…" : "Test Instantly key"}</button>
            {inst && <span style={muted}>{inst}</span>}
          </div>
        )}
      </Section>

      <Section title="Team" sub="Who can sign in. Changing this is a Netlify setting." canEdit={false}>
        <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
          <div><strong>Owner</strong> (approves, edits settings): {data.team.owners.join(", ")}</div>
          <div><strong>Operator</strong> (prepares, can't approve): {data.team.operators.join(", ")}</div>
        </div>
      </Section>

      <Section title="Status lists" sub="The lists the CRM uses. Shown for reference." canEdit={false}>
        {([["Prospect statuses", data.lists.statuses], ["Deal stages", data.lists.deal_stages], ["Service angles", data.lists.service_angles], ["Categories", data.lists.categories]] as const).map(([name, list]) => (
          <div key={name} style={{ marginBottom: 10 }}>
            <div style={lbl}>{name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{list.map((s) => <span key={s} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, border: `1px solid ${T.border}`, color: T.textSub }}>{s}</span>)}</div>
          </div>
        ))}
      </Section>
    </div>
  );
}
