"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";

// The prospect drawer's sequence timeline (C4): every step drafted, approved,
// sent, cancelled or still scheduled, with times, plus enroll, pause, resume,
// remove, and the reply / booking / bounce buttons that trigger the stop rules.

interface Enrollment { id: string; sequence_id: string; status: string; stop_reason: string | null; next_step: number | null; next_due_at: string | null; enrolled_at: string; enrolled_by: string | null; updated_at: string; sequences: { name: string } | null }
interface Message { id: string; enrollment_id: string; step_number: number; subject: string; body: string; status: string; due_at: string; note: string | null; created_at: string; decided_at: string | null; sent_at: string | null }
interface Data { enrollments: Enrollment[]; messages: Message[]; active_sequences: { id: string; name: string }[] }

const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", height: 30, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 12 };
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
const HUE: Record<string, string> = { active: "#16a34a", paused: "#d97706", finished: "#64748b", removed: "#dc2626", draft: "#2563eb", approved: "#16a34a", sent: "#16a34a", rejected: "#dc2626", cancelled: "#64748b" };
const LABEL: Record<string, string> = { draft: "Draft, waiting for approval", approved: "Approved, not sent", sent: "Sent", rejected: "Rejected", cancelled: "Cancelled", active: "Active", paused: "Paused", finished: "All steps drafted", removed: "Removed" };
const REASON: Record<string, string> = { reply: "a reply", booking: "a booking", bounce: "a bounced email", do_not_contact: "Do Not Contact", manual: "by hand", status: "a status change" };

function Pill({ s }: { s: string }) {
  const h = HUE[s] ?? "#64748b";
  return <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 999, background: alpha(h, 12), color: h, border: `1px solid ${alpha(h, 30)}`, whiteSpace: "nowrap" }}>{LABEL[s] ?? s}</span>;
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}

export default function SeqTimeline({ prospectId, emailInvalid, onChanged }: { prospectId: string; emailInvalid: boolean; onChanged: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setData(await api<Data>(`/api/dashboard/sequences?prospect=${prospectId}`)); setErr(null); }
    catch (e) { setErr((e as Error).message); }
  }, [prospectId]);
  useEffect(() => { load(); }, [load]);

  const act = async (key: string, body: unknown) => {
    setBusy(key); setErr(null);
    try { await api("/api/dashboard/sequences", { method: "POST", body: JSON.stringify(body) }); await load(); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(null); }
  };

  if (!data) return <div style={{ ...muted, padding: 8 }} role="status">{err ?? "Loading sequences…"}</div>;
  const live = new Set(data.enrollments.filter((e) => ["active", "paused"].includes(e.status)).map((e) => e.sequence_id));
  const choices = data.active_sequences.filter((s) => !live.has(s.id));

  return (
    <div>
      {err && <div style={{ color: T.danger, fontSize: 13, marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <select aria-label="Sequence to enroll in" value={pick} onChange={(e) => setPick(e.target.value)}
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "4px 8px", borderRadius: 6, flex: "1 1 180px" }}>
          <option value="">{choices.length ? "Enroll in a sequence…" : "No active sequence to enroll in"}</option>
          {choices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button style={btn(true)} disabled={!pick || !!busy} onClick={() => act("enroll", { op: "enroll", sequence_id: pick, prospect_ids: [prospectId] }).then(() => setPick(""))}>{busy === "enroll" ? "Enrolling…" : "Enroll"}</button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ ...muted, alignSelf: "center" }}>Record:</span>
        <button style={btn()} disabled={!!busy} onClick={() => act("reply", { op: "event", prospect_id: prospectId, kind: "reply" })}>They replied</button>
        <button style={btn()} disabled={!!busy} onClick={() => act("booking", { op: "event", prospect_id: prospectId, kind: "booking" })}>They booked</button>
        {emailInvalid
          ? <button style={btn()} disabled={!!busy} onClick={() => act("clear", { op: "clear_bounce", prospect_id: prospectId })}>Email bounced · Clear</button>
          : <button style={btn()} disabled={!!busy} onClick={() => act("bounce", { op: "event", prospect_id: prospectId, kind: "bounce" })}>Email bounced</button>}
      </div>

      {data.enrollments.length === 0 && <div style={muted}>Not in any sequence.</div>}
      {data.enrollments.map((e) => {
        const msgs = data.messages.filter((m) => m.enrollment_id === e.id);
        return (
          <div key={e.id} style={{ padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 160 }}>{e.sequences?.name ?? "Sequence"}</span>
              <Pill s={e.status} />
              {e.status === "active" && <button style={btn()} disabled={!!busy} onClick={() => act(`p${e.id}`, { op: "enrollment", id: e.id, action: "pause" })}>Pause</button>}
              {e.status === "paused" && <button style={btn()} disabled={!!busy} onClick={() => act(`r${e.id}`, { op: "enrollment", id: e.id, action: "resume" })}>Resume</button>}
              {["active", "paused"].includes(e.status) && <button style={btn(false, { color: T.danger })} disabled={!!busy} onClick={() => act(`x${e.id}`, { op: "enrollment", id: e.id, action: "remove" })}>Remove</button>}
            </div>
            <div style={muted}>
              Enrolled {when(e.enrolled_at)}{e.enrolled_by ? ` by ${e.enrolled_by}` : ""}
              {e.stop_reason ? ` · stopped by ${REASON[e.stop_reason] ?? e.stop_reason} ${when(e.updated_at)}` : ""}
              {e.status === "active" && e.next_step ? ` · step ${e.next_step} drafts ${when(e.next_due_at)}` : ""}
            </div>
            {msgs.map((m) => (
              <div key={m.id} style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${T.border}` }}>
                <button onClick={() => setOpen(open === m.id ? null : m.id)} aria-expanded={open === m.id}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: T.text, fontFamily: BODY, fontSize: 13, textAlign: "left", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span>Step {m.step_number}: {m.subject}</span><Pill s={m.status} />
                </button>
                <div style={muted}>Drafted {when(m.created_at)} · due {when(m.due_at)}{m.decided_at ? ` · ${m.status} ${when(m.decided_at)}` : ""}{m.sent_at ? ` · sent ${when(m.sent_at)}` : ""}</div>
                {m.note && <div style={muted}>{m.note}</div>}
                {open === m.id && <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 13, margin: "6px 0 0", padding: 10, background: T.panel, borderRadius: 6, border: `1px solid ${T.border}` }}>{m.body}</pre>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
