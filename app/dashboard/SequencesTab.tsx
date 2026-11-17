"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Sequences (C4): ordered follow-up steps, a live preview with a real
// prospect, enrollment from a saved view or a campaign (with a count to
// confirm), and every draft each sequence has made. Drafts never send: each
// batch is an approval in the Command Center, and Matt alone can pre-approve
// a sequence after he has approved one of its batches.
// ─────────────────────────────────────────────────────────────────────────────

interface SeqRow { id: string; name: string; description: string | null; status: string; preapproved: boolean; first_batch_approved: boolean; legacy_id: number | null; steps: number; active: number; paused: number; drafts: number; approved: number }
interface Step { step_number: number; day_offset: number; subject: string; body: string }
interface Detail {
  sequence: SeqRow & { preapproved_by: string | null; preapproved_at: string | null };
  steps: Step[];
  enrollments: { id: string; prospect_id: string; status: string; stop_reason: string | null; next_step: number | null; next_due_at: string | null; enrolled_at: string; crm_prospects: { company: string; email: string | null; status: string } | null }[];
  messages: { id: string; step_number: number; to_email: string; subject: string; body: string; status: string; due_at: string; note: string | null; created_at: string; crm_prospects: { company: string } | null }[];
  can_own: boolean; vars: string[]; send_enabled: boolean;
}
interface Preview { prospect: { company: string; first_name: string | null; email: string | null; status: string }; eligible: boolean; reason: string | null; steps: { step_number: number; day_offset: number; subject: string; body: string }[] }
interface Check { sequence: string; status: string; source: string; matched: number; eligible: number; skipped: { reason: string; count: number; examples: string[] }[] }

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 34, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const input: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const h2: React.CSSProperties = { fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text, margin: 0 };
const lbl: React.CSSProperties = { display: "block", fontSize: 12, color: T.muted, marginBottom: 4, fontFamily: BODY };
const when = (s: string | null) => (s ? new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
const HUE: Record<string, string> = { draft: "#64748b", active: "#16a34a", archived: "#64748b", paused: "#d97706", finished: "#64748b", removed: "#dc2626", approved: "#16a34a", sent: "#16a34a", rejected: "#dc2626", cancelled: "#64748b" };
const MSG: Record<string, string> = { draft: "Waiting for approval", approved: "Approved, not sent", sent: "Sent", rejected: "Rejected", cancelled: "Cancelled" };
function Pill({ s, label }: { s: string; label?: string }) {
  const h = HUE[s] ?? "#64748b";
  return <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(h, 12), color: h, border: `1px solid ${alpha(h, 30)}`, whiteSpace: "nowrap" }}>{label ?? s[0].toUpperCase() + s.slice(1)}</span>;
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}
const post = <X,>(body: unknown) => api<X>("/api/dashboard/sequences", { method: "POST", body: JSON.stringify(body) });

export default function SequencesTab() {
  const [list, setList] = useState<{ sequences: SeqRow[]; send_enabled: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setList(await api("/api/dashboard/sequences")); setErr(null); } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (openId || creating) return <SequenceEditor id={openId} onBack={() => { setOpenId(null); setCreating(false); load(); }} onCreated={(id) => { setCreating(false); setOpenId(id); }} />;
  if (err) return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13 })}>{err}</div>;
  if (!list) return <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>Loading sequences…</div>;

  return (
    <div>
      <div className="dash-in" style={card({ marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" })}>
        <span style={{ fontSize: 14, flex: 1, minWidth: 220 }}>Follow-ups are drafted when they come due and wait for approval in the Command Center. None of them send yet.</span>
        <button style={btn()} onClick={async () => { try { const r = await post<{ drafted: number; approvals: number }>({ op: "draft_due" }); setMsg(r.drafted ? `${r.drafted} draft${r.drafted === 1 ? "" : "s"} made${r.approvals ? `, ${r.approvals} approval${r.approvals === 1 ? "" : "s"} filed` : ""}.` : "Nothing is due right now."); load(); } catch (e) { setMsg((e as Error).message); } }}>Draft what's due</button>
        <button style={btn(true)} onClick={() => setCreating(true)}>New sequence</button>
      </div>
      {msg && <div style={card({ marginBottom: 12, fontSize: 14 })}>{msg}</div>}
      {list.sequences.length === 0 && <div style={card(muted)}>No sequences yet.</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {list.sequences.map((q) => (
          <button key={q.id} className="dash-in" onClick={() => setOpenId(q.id)} style={{ ...card(), textAlign: "left", cursor: "pointer", color: T.text, fontFamily: BODY, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 220 }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: 15 }}>{q.name}</span>
              <span style={{ ...muted, display: "block" }}>{q.steps} step{q.steps === 1 ? "" : "s"} · {q.active} active · {q.paused} paused · {q.drafts} waiting for approval{q.approved ? ` · ${q.approved} approved` : ""}{q.legacy_id ? " · from Manus" : ""}</span>
            </span>
            {q.preapproved && <Pill s="approved" label="Pre-approved" />}
            <Pill s={q.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SequenceEditor({ id, onBack, onCreated }: { id: string | null; onBack: () => void; onCreated: (id: string) => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [steps, setSteps] = useState<Step[]>([{ step_number: 1, day_offset: 0, subject: "", body: "Hi {{firstName|there}},\n\n\n\n{{senderName}}" }]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [src, setSrc] = useState<{ kind: "view" | "campaign"; id: string }>({ kind: "view", id: "" });
  const [sources, setSources] = useState<{ views: { id: string; name: string }[]; campaigns: { id: string; name: string; recipient_count: number }[] }>({ views: [], campaigns: [] });
  const [check, setCheck] = useState<Check | null>(null);
  const [openMsg, setOpenMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await api<Detail>(`/api/dashboard/sequences?id=${id}`);
      setD(r); setName(r.sequence.name); setDesc(r.sequence.description ?? ""); setSteps(r.steps.map(({ step_number, day_offset, subject, body }) => ({ step_number, day_offset, subject, body }))); setErr(null);
    } catch (e) { setErr((e as Error).message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api<{ views: { id: string; name: string }[]; campaigns: { id: string; name: string; recipient_count: number }[] }>("/api/dashboard/campaigns").then((r) => setSources({ views: r.views, campaigns: r.campaigns })).catch(() => {});
  }, []);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr(null); setMsg(null);
    try { await fn(); } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };
  const setStep = (i: number, patch: Partial<Step>) => { setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x))); setPreview(null); };
  const seq = d?.sequence;
  const locked = (d?.enrollments ?? []).some((e) => ["active", "paused"].includes(e.status));

  if (id && !d) return <div role="status" style={{ ...muted, padding: 40, textAlign: "center" }}>{err ?? "Loading sequence…"}</div>;

  return (
    <div>
      <button style={btn(false, { marginBottom: 12 })} onClick={onBack}>← All sequences</button>
      {seq && (
        <div className="dash-in" style={card({ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
          <Pill s={seq.status} />
          {seq.preapproved && <Pill s="approved" label={`Pre-approved by ${seq.preapproved_by ?? "Matt"}`} />}
          <span style={{ ...muted, flex: 1, minWidth: 200 }}>
            {seq.status === "draft" ? "Draft: nobody can be enrolled until Matt makes it active." : seq.status === "active" ? "Active: prospects can be enrolled." : "Archived."}
            {seq.preapproved ? " Its drafts are approved as they're made; nothing sends while sending is off." : seq.first_batch_approved ? " Matt has approved a batch, so it can be pre-approved." : " Each batch of drafts needs Matt's approval."}
          </span>
          {d!.can_own && seq.status !== "active" && <button style={btn(true)} disabled={!!busy} onClick={() => act("status", async () => { await post({ op: "status", id: seq.id, status: "active" }); await load(); })}>Make active</button>}
          {d!.can_own && seq.status === "active" && <button style={btn()} disabled={!!busy} onClick={() => act("status", async () => { await post({ op: "status", id: seq.id, status: "draft" }); await load(); })}>Back to draft</button>}
          {d!.can_own && seq.status !== "archived" && <button style={btn()} disabled={!!busy} onClick={() => act("status", async () => { await post({ op: "status", id: seq.id, status: "archived" }); await load(); })}>Archive</button>}
          {d!.can_own && (seq.preapproved
            ? <button style={btn()} disabled={!!busy} onClick={() => act("pre", async () => { await post({ op: "preapprove", id: seq.id, on: false }); await load(); })}>Turn off pre-approval</button>
            : <button style={btn()} disabled={!!busy || !seq.first_batch_approved} title={seq.first_batch_approved ? undefined : "Approve one batch of its drafts first"} onClick={() => act("pre", async () => { await post({ op: "preapprove", id: seq.id, on: true }); await load(); })}>Pre-approve later steps</button>)}
        </div>
      )}
      {(err || msg) && <div style={card({ marginBottom: 12, fontSize: 14, color: err ? T.danger : T.text, borderColor: err ? alpha(T.danger, 40) : alpha("#16a34a", 40) })}>{err ?? msg}</div>}

      <section style={card({ marginBottom: 16 })}>
        <h2 style={{ ...h2, marginBottom: 12 }}>{id ? "Steps" : "New sequence"}</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: 12 }}>
          <label><span style={lbl}>Name</span><input style={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label><span style={lbl}>Description</span><input style={input} value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        </div>
        {locked && <p style={{ ...muted, margin: "0 0 10px" }}>Prospects are in this sequence, so steps and days are fixed. Wording can still change; it applies to drafts not made yet.</p>}
        {steps.map((s, i) => (
          <div key={i} style={{ borderTop: `1px solid ${T.border}`, padding: "12px 0" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Step {i + 1}</span>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>Day <input style={{ ...input, width: 70 }} type="number" min={0} max={365} disabled={locked} value={s.day_offset} onChange={(e) => setStep(i, { day_offset: Number(e.target.value) })} /></label>
              <span style={{ flex: 1 }} />
              {!locked && steps.length > 1 && <button style={btn(false, { height: 28, fontSize: 12, color: T.danger })} onClick={() => setSteps((x) => x.filter((_, j) => j !== i).map((y, j) => ({ ...y, step_number: j + 1 })))}>Remove step</button>}
            </div>
            <label style={{ display: "block", marginBottom: 8 }}><span style={lbl}>Subject</span><input style={input} value={s.subject} onChange={(e) => setStep(i, { subject: e.target.value })} /></label>
            <label style={{ display: "block" }}><span style={lbl}>Body</span><textarea style={{ ...input, minHeight: 150, resize: "vertical", lineHeight: 1.5 }} value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} /></label>
          </div>
        ))}
        <p style={{ ...muted, margin: "8px 0" }}>Fill-ins: {["firstName", "contactName", "companyName", "city", "state", "category", "senderName", "bookingLink"].map((v) => `{{${v}}}`).join(", ")}. Add a fallback after a bar: {"{{firstName|there}}"}. The signature, mailing address and unsubscribe link are added to every draft.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!locked && <button style={btn()} onClick={() => setSteps((x) => [...x, { step_number: x.length + 1, day_offset: (x[x.length - 1]?.day_offset ?? 0) + 3, subject: "", body: "Hi {{firstName|there}},\n\n\n\n{{senderName}}" }])}>Add step</button>}
          <button style={btn(true)} disabled={!!busy} onClick={() => act("save", async () => {
            const r = await post<Detail>({ op: "save", id: id ?? undefined, name, description: desc, steps });
            if (!id) onCreated(r.sequence.id); else { setD(r); setMsg("Saved."); }
          })}>{busy === "save" ? "Saving…" : "Save"}</button>
        </div>
      </section>

      <section style={card({ marginBottom: 16 })}>
        <h2 style={{ ...h2, marginBottom: 8 }}>Preview with a real prospect</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...input, flex: "1 1 220px", width: "auto" }} placeholder="Company name (blank: top-scored prospect)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
          <button style={btn()} disabled={!!busy} onClick={() => act("preview", async () => setPreview(await post<Preview>({ op: "preview", steps, q })))}>{busy === "preview" ? "Loading…" : "Preview"}</button>
        </div>
        {preview && (
          <div className="dash-in" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}><strong>{preview.prospect.company}</strong>{preview.prospect.first_name ? `, ${preview.prospect.first_name}` : ""} <span style={muted}>· {preview.prospect.email} · {preview.eligible ? "can be enrolled" : `can't be enrolled: ${preview.reason}`}</span></div>
            {preview.steps.map((s) => (
              <div key={s.step_number} style={card({ background: T.surface, marginBottom: 8 })}>
                <div style={lbl}>Step {s.step_number} · day {s.day_offset}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{s.subject}</div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{s.body}</pre>
              </div>
            ))}
          </div>
        )}
      </section>

      {seq && (
        <section style={card({ marginBottom: 16 })}>
          <h2 style={{ ...h2, marginBottom: 8 }}>Enroll prospects</h2>
          {seq.status !== "active" && <p style={{ ...muted, margin: "0 0 8px" }}>Make the sequence active before enrolling anyone. You can still check the numbers.</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select style={{ ...input, width: 140 }} value={src.kind} onChange={(e) => { setSrc({ kind: e.target.value as "view" | "campaign", id: "" }); setCheck(null); }}>
              <option value="view">Saved view</option><option value="campaign">Campaign</option>
            </select>
            <select style={{ ...input, flex: "1 1 220px", width: "auto" }} value={src.id} onChange={(e) => { setSrc({ ...src, id: e.target.value }); setCheck(null); }}>
              <option value="">{src.kind === "view" ? (sources.views.length ? "Pick a saved view…" : "No saved views yet (save one on the CRM tab)") : (sources.campaigns.length ? "Pick a campaign…" : "No campaigns yet")}</option>
              {(src.kind === "view" ? sources.views : sources.campaigns).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <button style={btn()} disabled={!src.id || !!busy} onClick={() => act("check", async () => setCheck(await post<Check>({ op: "check_enroll", sequence_id: seq.id, [src.kind === "view" ? "view_id" : "campaign_id"]: src.id })))}>{busy === "check" ? "Counting…" : "Count"}</button>
          </div>
          {check && (
            <div className="dash-in" style={{ marginTop: 12, fontSize: 14 }}>
              <div><strong>{check.eligible}</strong> of {check.matched} in {check.source} can be enrolled.</div>
              {check.skipped.map((x) => <div key={x.reason} style={muted}>{x.count} skipped: {x.reason}{x.examples.length ? ` (e.g. ${x.examples.join(", ")})` : ""}</div>)}
              {check.eligible > 0 && seq.status === "active" && (
                <button style={btn(true, { marginTop: 10 })} disabled={!!busy} onClick={() => act("enroll", async () => {
                  const r = await post<{ enrolled: number; drafted: number; approvals: number; preapproved: number }>({ op: "enroll", sequence_id: seq.id, [src.kind === "view" ? "view_id" : "campaign_id"]: src.id, expected_count: check.eligible });
                  setMsg(`Enrolled ${r.enrolled}. ${r.drafted} Day 0 draft${r.drafted === 1 ? "" : "s"} made${r.approvals ? " and sent to Approvals in the Command Center" : r.preapproved ? " and approved under pre-approval" : ""}. Nothing was sent.`);
                  setCheck(null); await load();
                })}>{busy === "enroll" ? "Enrolling…" : `Enroll ${check.eligible}`}</button>
              )}
            </div>
          )}
        </section>
      )}

      {seq && (
        <section style={card({ marginBottom: 16 })}>
          <h2 style={{ ...h2, marginBottom: 8 }}>Drafts ({d!.messages.length})</h2>
          {d!.messages.length === 0 && <p style={muted}>No drafts yet.</p>}
          {d!.messages.map((m) => (
            <div key={m.id} style={{ padding: "8px 0", borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => setOpenMsg(openMsg === m.id ? null : m.id)} aria-expanded={openMsg === m.id} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: T.text, fontFamily: BODY, fontSize: 14, textAlign: "left", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
                <span style={{ flex: 1, minWidth: 200 }}>{m.crm_prospects?.company ?? m.to_email} · step {m.step_number}: {m.subject}</span>
                <Pill s={m.status} label={MSG[m.status]} />
              </button>
              <div style={muted}>Drafted {when(m.created_at)} · due {when(m.due_at)}{m.note ? ` · ${m.note}` : ""}</div>
              {openMsg === m.id && <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 13, margin: "6px 0 0", padding: 10, background: T.surface, borderRadius: 6, border: `1px solid ${T.border}` }}>To: {m.to_email}{"\n\n"}{m.body}</pre>}
            </div>
          ))}
        </section>
      )}

      {seq && (
        <section style={card()}>
          <h2 style={{ ...h2, marginBottom: 8 }}>Enrolled ({d!.enrollments.length})</h2>
          {d!.enrollments.length === 0 && <p style={muted}>Nobody yet.</p>}
          {d!.enrollments.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderTop: `1px solid ${T.border}`, flexWrap: "wrap", fontSize: 14 }}>
              <span style={{ flex: 1, minWidth: 200 }}>{e.crm_prospects?.company ?? "—"} <span style={muted}>· enrolled {when(e.enrolled_at)}{e.stop_reason ? ` · stopped: ${e.stop_reason}` : ""}{e.status === "active" && e.next_step ? ` · step ${e.next_step} drafts ${when(e.next_due_at)}` : ""}</span></span>
              <Pill s={e.status} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
