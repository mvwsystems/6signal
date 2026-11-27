"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Conversations (C5): Casey's Gmail inbox, matched to prospects. Each
// conversation shows the full back-and-forth, a suggested intent you can
// change, a Stop button (Do Not Contact, every sequence paused), and a reply
// box. A reply is an approval; approving it puts a draft in Casey's Gmail.
// Nothing sends from here.
// ─────────────────────────────────────────────────────────────────────────────

interface ThreadRow { id: string; subject: string | null; from_email: string | null; from_name: string | null; snippet: string | null; intent: string | null; intent_source: string; status: string; last_message_at: string | null; prospect_id: string | null; crm_prospects: { company: string; status: string } | null }
interface ListData { threads: ThreadRow[]; total: number; configured: boolean; mailbox: string; last_sync_at: string | null; counts: { matched: number; unmatched: number; needs_review: number } }
interface Msg { id: string; direction: "in" | "out"; from_email: string | null; from_name: string | null; to_emails: string[]; subject: string | null; body_text: string | null; new_text: string | null; sent_at: string }
interface Reply { id: string; body: string; status: string; note: string | null; created_by: string | null; created_at: string }
interface Detail { thread: ThreadRow & { crm_prospects: { id: string; company: string; status: string; email: string | null } | null }; messages: Msg[]; replies: Reply[] }

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const pill = (on: boolean): React.CSSProperties => ({ fontFamily: BODY, fontSize: 13, padding: "6px 14px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub });
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
const INTENT: Record<string, { label: string; hue: string }> = {
  interested: { label: "Interested", hue: "#16a34a" }, question: { label: "Question", hue: "#2563eb" }, objection: { label: "Objection", hue: "#d97706" },
  not_now: { label: "Not now", hue: "#64748b" }, stop: { label: "Stop", hue: "#dc2626" }, other: { label: "Other", hue: "#64748b" },
};
const STATUS: Record<string, string> = { needs_review: "Needs review", waiting: "Waiting", handled: "Handled" };
const REPLY: Record<string, string> = { pending_approval: "Waiting for approval", approved: "Approved", in_gmail: "In Casey's Gmail drafts", killed: "Killed", failed: "Failed" };

function Pill({ text, hue }: { text: string; hue: string }) {
  return <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{text}</span>;
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}
const post = <X,>(body: unknown) => api<X>("/api/dashboard/inbox", { method: "POST", body: JSON.stringify(body) });

export default function InboxTab() {
  const [tab, setTab] = useState<"matched" | "unmatched">("matched");
  const [status, setStatus] = useState<string>("");
  const [data, setData] = useState<ListData | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try { setData(await api<ListData>(`/api/dashboard/inbox?tab=${tab}${status ? `&status=${status}` : ""}`)); setErr(null); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }, [tab, status]);
  useEffect(() => { load(); }, [load]);

  if (openId) return <ThreadView id={openId} onBack={() => { setOpenId(null); load(); }} />;

  return (
    <div>
      <div className="dash-in" style={card({ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" })}>
        <span style={{ fontSize: 14, flex: 1, minWidth: 220 }}>
          {data?.configured === false
            ? `Gmail isn't connected yet, so ${data.mailbox}'s mail can't be read. Matt connects it in Settings, under Sending engine.`
            : `Reading ${data?.mailbox ?? "Casey's inbox"}${data?.last_sync_at ? `, last checked ${when(data.last_sync_at)}` : ""}. Replies are drafted here and approved; they're sent from Gmail.`}
        </span>
        {data?.configured && <button style={btn()} disabled={busy} onClick={async () => {
          setBusy(true); setMsg(null);
          try { const r = await post<{ added: number; matched: number; unmatched: number }>({ op: "sync" }); setMsg(`${r.added} new message${r.added === 1 ? "" : "s"}: ${r.matched} from prospects, ${r.unmatched} unmatched.`); await load(); }
          catch (e) { setErr((e as Error).message); setBusy(false); }
        }}>{busy ? "Checking…" : "Check now"}</button>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button style={pill(tab === "matched")} onClick={() => setTab("matched")}>Prospects ({data?.counts.matched ?? "…"})</button>
        <button style={pill(tab === "unmatched")} onClick={() => setTab("unmatched")}>Unmatched ({data?.counts.unmatched ?? "…"})</button>
        <span style={{ width: 12 }} />
        {["", "needs_review", "waiting", "handled"].map((s) => <button key={s} style={pill(status === s)} onClick={() => setStatus(s)}>{s ? STATUS[s] : "All"}</button>)}
      </div>
      {(err || msg) && <div style={card({ marginBottom: 12, fontSize: 14, color: err ? T.danger : T.text })}>{err ?? msg}</div>}
      {!data && <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>Loading conversations…</div>}
      {data && data.threads.length === 0 && <div style={card(muted)}>{tab === "unmatched" ? "No unmatched mail." : "No conversations with prospects yet."}</div>}
      <div className={busy && data ? "dash-busy" : undefined} style={{ display: "grid", gap: 8 }}>
        {data?.threads.map((t) => (
          <button key={t.id} className="dash-in" onClick={() => setOpenId(t.id)} style={{ ...card({ padding: 12 }), textAlign: "left", cursor: "pointer", color: T.text, fontFamily: BODY, display: "grid", gap: 4 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 180 }}>{t.crm_prospects?.company ?? t.from_name ?? t.from_email}</span>
              {t.intent && <Pill text={`${INTENT[t.intent]?.label ?? t.intent}${t.intent_source === "auto" ? "?" : ""}`} hue={INTENT[t.intent]?.hue ?? "#64748b"} />}
              <Pill text={STATUS[t.status] ?? t.status} hue={t.status === "needs_review" ? "#d97706" : "#64748b"} />
            </span>
            <span style={{ fontSize: 13 }}>{t.subject ?? "(no subject)"}</span>
            <span style={{ ...muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{when(t.last_message_at)} · {t.from_email} · {t.snippet}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadView({ id, onBack }: { id: string; onBack: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [full, setFull] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setD(await api<Detail>(`/api/dashboard/inbox?id=${id}`)); setErr(null); } catch (e) { setErr((e as Error).message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const act = async (key: string, body: unknown, after?: () => void) => {
    setBusy(key); setErr(null);
    try { const r = await post<Detail | { ok: boolean }>(body); if ("thread" in r) setD(r); else await load(); after?.(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };

  if (!d) return <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>{err ?? "Loading conversation…"}</div>;
  const t = d.thread;
  const dnc = t.crm_prospects?.status === "Do Not Contact";
  return (
    <div>
      <button style={btn(false, { marginBottom: 12 })} onClick={onBack}>← All conversations</button>
      <div className="dash-in" style={card({ marginBottom: 12 })}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{t.subject ?? "(no subject)"}</div>
        <div style={muted}>{t.crm_prospects ? `${t.crm_prospects.company} · ${t.crm_prospects.status}` : "Not matched to a prospect"} · {t.from_name ? `${t.from_name} <${t.from_email}>` : t.from_email}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <label style={{ ...muted, display: "flex", gap: 6, alignItems: "center" }}>Intent
            <select value={t.intent ?? "other"} onChange={(e) => act("intent", { op: "update", id, intent: e.target.value })}
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "4px 8px", borderRadius: 6 }}>
              {Object.entries(INTENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {t.intent_source === "auto" && <span>(suggested)</span>}
          </label>
          <label style={{ ...muted, display: "flex", gap: 6, alignItems: "center" }}>Status
            <select value={t.status} onChange={(e) => act("status", { op: "update", id, status: e.target.value })}
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "4px 8px", borderRadius: 6 }}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <span style={{ flex: 1 }} />
          {!t.prospect_id && <button style={btn()} disabled={!!busy} onClick={() => act("mk", { op: "make_prospect", id })}>{busy === "mk" ? "Adding…" : "Make them a prospect"}</button>}
          {t.prospect_id && !dnc && <button style={btn(false, { color: T.danger, borderColor: alpha(T.danger, 40) })} disabled={!!busy}
            onClick={() => { if (confirm("Mark them Do Not Contact? This removes them from every sequence and any campaign that hasn't started sending.")) act("stop", { op: "stop", id }); }}>{busy === "stop" ? "Stopping…" : "Stop: Do Not Contact"}</button>}
          {dnc && <Pill text="Do Not Contact" hue="#dc2626" />}
        </div>
      </div>
      {err && <div style={card({ marginBottom: 12, color: T.danger, fontSize: 14 })}>{err}</div>}

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {d.messages.map((m) => (
          <div key={m.id} className="dash-in" style={card({ padding: 12, marginLeft: m.direction === "out" ? 24 : 0, marginRight: m.direction === "in" ? 24 : 0, borderColor: m.direction === "in" ? alpha("#2563eb", 30) : T.border })}>
            <div style={muted}>{m.direction === "in" ? `From ${m.from_name ?? m.from_email}` : "Casey"} · {when(m.sent_at)}</div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>{full === m.id ? m.body_text : (m.new_text ?? m.body_text)}</pre>
            {m.new_text && m.new_text !== m.body_text && <button style={{ ...muted, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }} onClick={() => setFull(full === m.id ? null : m.id)}>{full === m.id ? "Hide earlier mail" : "Show earlier mail"}</button>}
          </div>
        ))}
        {d.replies.map((r) => (
          <div key={r.id} style={card({ padding: 12, marginLeft: 24, borderStyle: "dashed" })}>
            <div style={{ ...muted, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>Reply drafted by {r.created_by ?? "—"} · {when(r.created_at)} <Pill text={REPLY[r.status] ?? r.status} hue={r.status === "in_gmail" || r.status === "approved" ? "#16a34a" : r.status === "killed" || r.status === "failed" ? "#dc2626" : "#d97706"} /></div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 14, margin: "6px 0 0", lineHeight: 1.5 }}>{r.body}</pre>
            {r.note && <div style={{ ...muted, marginTop: 4 }}>{r.note}</div>}
          </div>
        ))}
      </div>

      {!dnc && (
        <div style={card()}>
          <label style={{ display: "block" }}><span style={{ ...muted, display: "block", marginBottom: 4 }}>Reply to {t.from_email}</span>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, width: "100%", minHeight: 140, resize: "vertical", lineHeight: 1.5 }} />
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            <button style={btn(true)} disabled={!reply.trim() || !!busy} onClick={() => act("reply", { op: "reply", id, body: reply }, () => setReply(""))}>{busy === "reply" ? "Saving…" : "Send for approval"}</button>
            <span style={muted}>Nothing sends from here. Once Matt approves it, it's a draft in Casey's Gmail.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// The prospect drawer's conversation list.
export function ProspectConversations({ prospectId }: { prospectId: string }) {
  const [threads, setThreads] = useState<{ id: string; subject: string | null; intent: string | null; status: string; last_message_at: string | null; inbox_messages: { id: string; direction: string; body_text: string | null; sent_at: string }[] }[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { api<{ threads: typeof threads }>(`/api/dashboard/inbox?prospect=${prospectId}`).then((r) => setThreads(r.threads ?? [])).catch(() => setThreads([])); }, [prospectId]);
  if (!threads) return <div style={muted} role="status">Loading conversations…</div>;
  if (!threads.length) return <div style={muted}>No email conversations with them yet.</div>;
  return (
    <div>
      {threads.map((t) => (
        <div key={t.id} style={{ padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
          <button onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: T.text, fontFamily: BODY, fontSize: 13, textAlign: "left", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span>{t.subject ?? "(no subject)"}</span>
            {t.intent && <Pill text={INTENT[t.intent]?.label ?? t.intent} hue={INTENT[t.intent]?.hue ?? "#64748b"} />}
            <span style={{ ...muted, fontSize: 12 }}>{STATUS[t.status]} · {when(t.last_message_at)}</span>
          </button>
          {open === t.id && [...t.inbox_messages].sort((a, b) => a.sent_at.localeCompare(b.sent_at)).map((m) => (
            <div key={m.id} style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${m.direction === "in" ? alpha("#2563eb", 50) : T.border}` }}>
              <div style={{ ...muted, fontSize: 12 }}>{m.direction === "in" ? "They wrote" : "Casey wrote"} · {when(m.sent_at)}</div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 13, margin: 0 }}>{(m.body_text ?? "").slice(0, 1500)}</pre>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
