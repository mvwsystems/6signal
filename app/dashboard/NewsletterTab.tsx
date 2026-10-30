"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { T, MONO, DISP, BODY } from "./theme";
import { renderBriefingEmail } from "../lib/newsletterHtml";

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter composer — issues of the Intelligence Brief, written in markdown,
// sent as Resend broadcasts, archived publicly at /briefings. Supabase holds
// the subscriber list; Resend only gets what it needs to send and to handle
// unsubscribes. Test send always goes out over the real marketing domain, so a
// passing test means that domain's DNS is actually working.
// ─────────────────────────────────────────────────────────────────────────────

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 20, ...extra });
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted };
const btn = (primary?: boolean, danger?: boolean): React.CSSProperties => ({
  background: primary ? T.accent : "transparent",
  color: primary ? "#060606" : danger ? T.danger : T.text,
  border: `1px solid ${primary ? T.accent : danger ? `${T.danger}66` : T.border}`,
  borderRadius: 2, padding: "9px 15px", fontFamily: DISP, fontWeight: 700, fontSize: 12.5, cursor: "pointer",
});
const inputStyle: React.CSSProperties = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "9px 12px", borderRadius: 2, outline: "none", width: "100%" };
const label: React.CSSProperties = { ...eyebrow, fontSize: 10, marginBottom: 5, display: "block" };

interface Issue {
  id: string; slug: string; subject: string; preview: string | null; body: string;
  status: "draft" | "scheduled" | "sent";
  recipients: number | null; sent_at: string | null; published_at: string | null; created_at: string;
}
interface Meta {
  configured: boolean; from: string; domainWarning: string | null;
  counts: { total: number; synced: number }; issues: Issue[];
}

const STARTER = `Open with the single thing you learned this week. One sentence.

## What we measured

Two or three sentences of the actual finding — numbers where you have them.

- First point worth keeping
- Second point worth keeping

> A line worth pulling out and sitting with.

[Get the AI Visibility Audit](https://6signal.co/visibility-check)

Sign off as you would in a real note.`;

export default function NewsletterTab() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Issue | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // The renderer is pure string work with no server dependencies, so the
  // preview is the same code the send path uses, running live as you type.
  const html = useMemo(
    () =>
      draft
        ? renderBriefingEmail({
            subject: draft.subject,
            body: draft.body,
            preview: draft.preview,
            unsubscribeUrl: "#",
          })
        : "",
    [draft]
  );

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/dashboard/newsletter");
      if (r.ok) setMeta(await r.json());
    } catch { /* leave prior state */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = useCallback(async (id: string) => {
    setSel(id); setMsg(null);
    try {
      const r = await fetch(`/api/dashboard/newsletter/${id}`);
      if (!r.ok) return;
      setDraft((await r.json()).issue);
    } catch { /* ignore */ }
  }, []);

  const create = async () => {
    const subject = prompt("Subject line for the new issue:");
    if (!subject?.trim()) return;
    setBusy("create");
    try {
      const r = await fetch("/api/dashboard/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ kind: "err", text: d.error ?? "Could not create." }); return; }
      await load();
      await open(d.id);
      setDraft((p) => (p ? { ...p, body: STARTER } : p));
    } finally { setBusy(null); }
  };

  const save = async () => {
    if (!draft) return;
    setBusy("save"); setMsg(null);
    try {
      const r = await fetch(`/api/dashboard/newsletter/${draft.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: draft.subject, preview: draft.preview, body: draft.body }),
      });
      if (!r.ok) { setMsg({ kind: "err", text: (await r.json()).error ?? "Save failed." }); return; }
      setMsg({ kind: "ok", text: "Saved." });
      await load();
    } finally { setBusy(null); }
  };

  const testSend = async () => {
    if (!draft) return;
    setBusy("test"); setMsg(null);
    try {
      await save();
      const r = await fetch(`/api/dashboard/newsletter/${draft.id}/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const d = await r.json();
      setMsg(r.ok ? { kind: "ok", text: `Test sent to ${d.to}.` } : { kind: "err", text: d.error ?? "Test failed." });
    } finally { setBusy(null); }
  };

  const realSend = async () => {
    if (!draft || !meta) return;
    const n = meta.counts.synced;
    if (!confirm(`Send "${draft.subject}" to ${n} synced contact${n === 1 ? "" : "s"}?\n\nThis cannot be undone.`)) return;
    setBusy("send"); setMsg(null);
    try {
      await save();
      const r = await fetch(`/api/dashboard/newsletter/${draft.id}/send`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ kind: "err", text: d.error ?? "Send failed." }); return; }
      setMsg({ kind: "ok", text: "Sent." });
      await load(); await open(draft.id);
    } finally { setBusy(null); }
  };

  const togglePublish = async () => {
    if (!draft) return;
    setBusy("publish");
    try {
      const published_at = draft.published_at ? null : new Date().toISOString();
      const r = await fetch(`/api/dashboard/newsletter/${draft.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published_at }),
      });
      if (r.ok) { setDraft({ ...draft, published_at }); await load(); }
    } finally { setBusy(null); }
  };

  const remove = async () => {
    if (!draft || !confirm(`Delete "${draft.subject}"?`)) return;
    setBusy("delete");
    try {
      const r = await fetch(`/api/dashboard/newsletter/${draft.id}`, { method: "DELETE" });
      if (!r.ok) { setMsg({ kind: "err", text: (await r.json()).error ?? "Delete failed." }); return; }
      setDraft(null); setSel(null); await load();
    } finally { setBusy(null); }
  };

  const sync = async () => {
    setBusy("sync"); setMsg(null);
    try {
      const r = await fetch("/api/dashboard/newsletter/sync", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { setMsg({ kind: "err", text: d.error ?? "Sync failed." }); return; }
      setMsg({
        kind: "ok",
        text: `Synced ${d.synced}${d.failed ? `, ${d.failed} failed` : ""}.${d.remaining ? ` ${d.remaining} left — run again.` : ""}`,
      });
      await load();
    } finally { setBusy(null); }
  };

  const edit = (patch: Partial<Issue>) => setDraft((p) => (p ? { ...p, ...patch } : p));

  if (!meta) return <div style={{ color: T.muted, fontFamily: MONO, fontSize: 13, padding: 40, textAlign: "center" }}>Loading newsletter…</div>;

  if (!meta.configured) {
    return (
      <div style={card()}>
        <span style={eyebrow}>Newsletter</span>
        <p style={{ color: T.muted, fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
          Not connected — add <span style={{ fontFamily: MONO }}>RESEND_API_KEY</span> and{" "}
          <span style={{ fontFamily: MONO }}>NEWSLETTER_FROM</span> in Netlify env vars.
        </p>
      </div>
    );
  }

  return (
    <div>
      {meta.domainWarning && (
        <div style={card({ borderColor: `${T.warn}66`, marginBottom: 16 })}>
          <span style={{ ...eyebrow, color: T.warn }}>Sending domain</span>
          <p style={{ color: T.text, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{meta.domainWarning}</p>
        </div>
      )}

      <div style={card({ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" })}>
        <div>
          <span style={eyebrow}>Audience</span>
          <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 20, marginTop: 6 }}>
            {meta.counts.synced.toLocaleString()} <span style={{ color: T.muted, fontSize: 13, fontWeight: 400 }}>of {meta.counts.total.toLocaleString()} leads in Resend</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted, marginTop: 6 }}>From: {meta.from}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={btn()} onClick={sync} disabled={busy === "sync"}>{busy === "sync" ? "Syncing…" : "Sync contacts"}</button>
          <button style={btn(true)} onClick={create} disabled={busy === "create"}>New issue</button>
        </div>
      </div>

      {msg && (
        <div style={card({ borderColor: msg.kind === "ok" ? `${T.accent}55` : `${T.danger}66`, marginBottom: 16, padding: "12px 18px" })}>
          <span style={{ color: msg.kind === "ok" ? T.text : T.danger, fontSize: 13 }}>{msg.text}</span>
        </div>
      )}

      <div className="m1col" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>
        <div style={card({ padding: 0, overflow: "hidden" })}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>Issues</div>
          {meta.issues.length === 0 && <div style={{ padding: 28, textAlign: "center", color: T.muted, fontSize: 13 }}>No issues yet.</div>}
          {meta.issues.map((i) => (
            <div key={i.id} onClick={() => open(i.id)}
              style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: sel === i.id ? T.bg : "transparent" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.35 }}>{i.subject}</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: i.status === "sent" ? T.accent : T.muted, marginTop: 5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {i.status}{i.published_at ? " · archived" : ""}
              </div>
            </div>
          ))}
        </div>

        {!draft ? (
          <div style={card({ padding: 48, textAlign: "center", color: T.muted, fontSize: 13 })}>
            Select an issue, or start a new one.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                <span style={eyebrow}>{draft.status === "sent" ? `Sent ${draft.sent_at ? new Date(draft.sent_at).toLocaleDateString() : ""}` : "Draft"}</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={btn()} onClick={save} disabled={busy === "save"}>{busy === "save" ? "Saving…" : "Save"}</button>
                  <button style={btn()} onClick={testSend} disabled={busy === "test"}>{busy === "test" ? "Sending…" : "Test send"}</button>
                  <button style={btn()} onClick={togglePublish} disabled={busy === "publish"}>{draft.published_at ? "Unpublish" : "Publish to archive"}</button>
                  {draft.status !== "sent" && (
                    <>
                      <button style={btn(true)} onClick={realSend} disabled={busy === "send"}>{busy === "send" ? "Sending…" : "Send to list"}</button>
                      <button style={btn(false, true)} onClick={remove} disabled={busy === "delete"}>Delete</button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <span style={label}>Subject</span>
                  <input style={inputStyle} value={draft.subject} onChange={(e) => edit({ subject: e.target.value })} />
                </div>
                <div>
                  <span style={label}>Preview text — the line shown after the subject in the inbox</span>
                  <input style={inputStyle} value={draft.preview ?? ""} onChange={(e) => edit({ preview: e.target.value })} />
                </div>
                <div>
                  <span style={label}>Body — markdown. A paragraph that is only a link becomes the button.</span>
                  <textarea
                    style={{ ...inputStyle, minHeight: 360, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.65, resize: "vertical" }}
                    value={draft.body}
                    onChange={(e) => edit({ body: e.target.value })}
                  />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: T.muted }}>
                  /briefings/{draft.slug}
                </div>
              </div>
            </div>

            <div style={card({ padding: 0, overflow: "hidden" })}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>Preview — exactly what sends</div>
              <iframe title="Email preview" srcDoc={html} style={{ width: "100%", height: 620, border: "none", background: "#060606", display: "block" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
