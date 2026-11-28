import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity, updateProspect, createProspect, stopForProspects } from "./crm";
import { perform, registerAction } from "./commandCenter";
import { gmailConfigured, gmailMailbox, searchMessages, getMessage, createDraft, RECONNECT_MSG } from "./gmail";
import { parseMessage, guessIntent, newText, buildReplyMime, companyGuess, INTENTS, ParsedMessage } from "./inboxCore";

// ─────────────────────────────────────────────────────────────────────────────
// C5: the two-way inbox on Casey's Gmail.
//
// Sync reads new mail in casey@'s Primary inbox and Sent folder, matches each
// conversation to a prospect by email address (the prospect's own or one of
// its decision makers'), suggests an intent, and applies the stop rule: a
// reply pauses the prospect's sequences. Unmatched inbound mail waits in an
// Unmatched tab.
//
// Replying here never sends. A reply becomes a Red approval; approving it
// puts a draft in Casey's Gmail, under the same conversation, and Casey sends
// it from Gmail, which stays the sending record.
// ─────────────────────────────────────────────────────────────────────────────

function client() {
  const s = db();
  if (!s) throw new CrmError("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", 503);
  return s;
}
function actor() {
  const a = currentActor();
  if (!a) throw new CrmError("Not signed in", 401);
  return a;
}
const now = () => new Date().toISOString();
const SVC = "Sales & proposals";
const FIRST_SYNC_DAYS = 30;
const MAX_PER_RUN = 300;

async function syncState(): Promise<{ last_sync_at: string | null }> {
  const { data } = await client().from("settings").select("value").eq("key", "gmail_sync").maybeSingle();
  return (data?.value as { last_sync_at: string | null }) ?? { last_sync_at: null };
}

async function connection(patch: Record<string, unknown>) {
  await client().from("connections").update({ ...patch, updated_at: now() }).eq("name", "gmail_casey");
}

// Prospect id for each address, from prospects' own emails and decision makers'.
async function matchAddresses(emails: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const list = Array.from(new Set(emails.filter(Boolean).map((e) => e.toLowerCase())));
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    const [p, c] = await Promise.all([
      client().from("crm_prospects").select("id,email").in("email", chunk),
      client().from("crm_contacts").select("prospect_id,email").in("email", chunk),
    ]);
    if (p.error) throw new CrmError(p.error.message);
    if (c.error) throw new CrmError(c.error.message);
    for (const r of c.data ?? []) if (r.email) out.set(r.email.toLowerCase(), r.prospect_id);
    for (const r of p.data ?? []) if (r.email) out.set(r.email.toLowerCase(), r.id); // the prospect's own email wins
  }
  // Emails in the CRM aren't always lower case; catch those too.
  const missing = list.filter((e) => !out.has(e));
  for (const e of missing.slice(0, 50)) {
    const { data } = await client().from("crm_prospects").select("id").ilike("email", e).limit(1).maybeSingle();
    if (data) out.set(e, data.id);
  }
  return out;
}

// A reply from a prospect: pause their sequences, and move a cold status on.
async function onReply(prospectId: string, m: ParsedMessage) {
  const { data: p } = await client().from("crm_prospects").select("id,company,status").eq("id", prospectId).maybeSingle();
  if (!p) return;
  if (["Never contacted", "Contacted"].includes(p.status)) await updateProspect(prospectId, { status: "Replied", last_contact_at: m.sent_at });
  else await stopForProspects([prospectId], "reply", "a reply in Casey's inbox");
  await logActivity({ entityType: "prospect", entityId: prospectId, action: "reply_received", summary: `Reply received from ${m.from_name || m.from_email} (${p.company}): "${(m.subject ?? "").slice(0, 80)}"`, service: SVC });
}

export async function syncInbox(): Promise<{ checked: number; added: number; matched: number; unmatched: number; replies: number; error?: string }> {
  const s = client();
  if (!(await gmailConfigured())) {
    await connection({ status: "not_configured" });
    throw new CrmError("Gmail isn't connected yet. Connect casey@ in Settings, under Sending engine.", 503);
  }
  const mailbox = gmailMailbox().toLowerCase();
  const state = await syncState();
  const since = state.last_sync_at ? new Date(new Date(state.last_sync_at).getTime() - 3600_000) : new Date(Date.now() - FIRST_SYNC_DAYS * 86400_000);
  const startedAt = now();
  let ids: string[];
  try {
    ids = await searchMessages(`after:${Math.floor(since.getTime() / 1000)} {in:sent (in:inbox category:primary)} -in:chats -in:spam -in:trash`, MAX_PER_RUN);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await connection({ status: "down", last_error: msg });
    throw new CrmError(msg, 502);
  }
  const known = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await s.from("inbox_messages").select("gmail_message_id").in("gmail_message_id", ids.slice(i, i + 200));
    for (const r of data ?? []) known.add(r.gmail_message_id);
  }
  const fresh: ParsedMessage[] = [];
  for (const id of ids.filter((x) => !known.has(x))) {
    try { fresh.push(parseMessage(await getMessage(id))); } catch (e) { console.error("[inbox] fetch", id, e); }
  }
  fresh.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
  const partyOf = (m: ParsedMessage) => (m.from_email === mailbox ? m.to_emails.find((t) => t !== mailbox) ?? null : m.from_email);
  const match = await matchAddresses(fresh.flatMap((m) => [m.from_email ?? "", ...m.to_emails]).filter((e) => e !== mailbox));

  let added = 0, matched = 0, unmatched = 0, replies = 0;
  for (const m of fresh) {
    const out = m.from_email === mailbox;
    const party = partyOf(m);
    const { data: existing } = await s.from("inbox_threads").select("*").eq("gmail_thread_id", m.gmail_thread_id).maybeSingle();
    const pid = existing?.prospect_id ?? (party ? match.get(party) ?? null : null) ?? (out ? m.to_emails.map((t) => match.get(t)).find(Boolean) ?? null : null);
    // Casey's own outbound mail only matters when it's to a prospect.
    if (out && !pid && !existing) continue;
    let threadId = existing?.id as string | undefined;
    if (!threadId) {
      const { data, error } = await s.from("inbox_threads").insert({
        gmail_thread_id: m.gmail_thread_id, prospect_id: pid, subject: m.subject, from_email: party, from_name: out ? null : m.from_name,
        snippet: m.snippet, status: out ? "waiting" : "needs_review", last_message_at: m.sent_at, last_inbound_at: out ? null : m.sent_at,
        intent: out ? null : guessIntent(m.body_text),
      }).select("id").single();
      if (error) throw new CrmError(error.message);
      threadId = data.id;
    }
    const { error: mErr } = await s.from("inbox_messages").insert({
      thread_id: threadId, gmail_message_id: m.gmail_message_id, direction: out ? "out" : "in", from_email: m.from_email, from_name: m.from_name,
      to_emails: m.to_emails, subject: m.subject, body_text: m.body_text, sent_at: m.sent_at,
    });
    if (mErr && !mErr.message.includes("duplicate")) throw new CrmError(mErr.message);
    added++;
    const patch: Record<string, unknown> = { last_message_at: m.sent_at, snippet: m.snippet, updated_at: now() };
    if (!existing?.prospect_id && pid) patch.prospect_id = pid;
    if (!out) {
      patch.last_inbound_at = m.sent_at;
      patch.status = "needs_review";
      if (!existing || existing.intent_source !== "manual") patch.intent = guessIntent(m.body_text);
      if (!existing?.from_name && m.from_name) patch.from_name = m.from_name;
    } else if (existing && existing.status === "needs_review") {
      patch.status = "waiting"; // Casey answered it from Gmail
    }
    if (existing) await s.from("inbox_threads").update(patch).eq("id", threadId);
    if (!out) {
      if (pid) { matched++; replies++; await onReply(pid, m); } else unmatched++;
    }
  }
  await s.from("settings").upsert({ key: "gmail_sync", value: { last_sync_at: startedAt }, updated_by: "Inbox sync", updated_at: now() });
  await connection({ status: "connected", last_sync_at: startedAt, last_error: null, note: `Reading ${mailbox}. Drafts only; nothing sends from the dashboard.` });
  return { checked: ids.length, added, matched, unmatched, replies };
}

// ─── Reading ────────────────────────────────────────────────────────────────

export async function listThreads(f: { tab?: string | null; status?: string | null; offset?: number }) {
  actor();
  let q = client().from("inbox_threads").select("*, crm_prospects(company,status)", { count: "exact" });
  q = f.tab === "unmatched" ? q.is("prospect_id", null) : q.not("prospect_id", "is", null);
  if (f.status && ["needs_review", "waiting", "handled"].includes(f.status)) q = q.eq("status", f.status);
  const { data, error, count } = await q.order("last_message_at", { ascending: false }).range(f.offset ?? 0, (f.offset ?? 0) + 49);
  if (error) throw new CrmError(error.message);
  const counts = await client().from("inbox_threads").select("prospect_id,status");
  const rows = counts.data ?? [];
  const sync = await syncState();
  const conn = (await client().from("connections").select("status,last_error").eq("name", "gmail_casey").maybeSingle()).data;
  return {
    needs_reconnect: conn?.status === "down" && conn.last_error === RECONNECT_MSG, reconnect_reason: conn?.status === "down" && conn.last_error === RECONNECT_MSG ? conn.last_error : null,
    threads: data ?? [], total: count ?? 0, configured: await gmailConfigured(), mailbox: gmailMailbox(), last_sync_at: sync.last_sync_at,
    counts: {
      matched: rows.filter((r) => r.prospect_id).length, unmatched: rows.filter((r) => !r.prospect_id).length,
      needs_review: rows.filter((r) => r.prospect_id && r.status === "needs_review").length,
    },
  };
}

export async function getThread(id: string) {
  actor();
  const s = client();
  const { data: t, error } = await s.from("inbox_threads").select("*, crm_prospects(id,company,status,email)").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!t) throw new CrmError("Conversation not found.", 404);
  const [m, r] = await Promise.all([
    s.from("inbox_messages").select("*").eq("thread_id", id).order("sent_at"),
    s.from("inbox_replies").select("*").eq("thread_id", id).order("created_at"),
  ]);
  if (m.error) throw new CrmError(m.error.message);
  if (r.error) throw new CrmError(r.error.message);
  return { thread: t, messages: (m.data ?? []).map((x) => ({ ...x, new_text: x.direction === "in" ? newText(x.body_text ?? "") : null })), replies: r.data ?? [] };
}

export async function prospectThreads(prospectId: string) {
  actor();
  const { data, error } = await client().from("inbox_threads").select("id,subject,intent,status,last_message_at,inbox_messages(id,direction,from_email,subject,body_text,sent_at)").eq("prospect_id", prospectId).order("last_message_at", { ascending: false });
  if (error) throw new CrmError(error.message);
  return { threads: data ?? [] };
}

// ─── Acting on a thread ─────────────────────────────────────────────────────

export async function updateThread(id: string, patch: { intent?: unknown; status?: unknown }) {
  const who = actor();
  const p: Record<string, unknown> = { updated_at: now() };
  if (patch.intent !== undefined) {
    if (!(INTENTS as readonly string[]).includes(String(patch.intent))) throw new CrmError("Unknown intent.", 400);
    p.intent = patch.intent; p.intent_source = "manual";
  }
  if (patch.status !== undefined) {
    if (!["needs_review", "waiting", "handled"].includes(String(patch.status))) throw new CrmError("Unknown status.", 400);
    p.status = patch.status;
  }
  const { data, error } = await client().from("inbox_threads").update(p).eq("id", id).select("id,prospect_id,subject").maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!data) throw new CrmError("Conversation not found.", 404);
  if (data.prospect_id) await logActivity({ entityType: "prospect", entityId: data.prospect_id, action: "inbox_updated", summary: `${who.name} marked the conversation "${(data.subject ?? "").slice(0, 60)}" ${[patch.intent && `as ${String(patch.intent).replace("_", " ")}`, patch.status && String(patch.status).replace("_", " ")].filter(Boolean).join(", ")}`, service: SVC });
  return { ok: true };
}

// "Stop": the prospect asked not to be contacted. Do Not Contact applies the
// stop rules (every sequence, every campaign not yet sending).
export async function stopThread(id: string) {
  const who = actor();
  const s = client();
  const { data: t } = await s.from("inbox_threads").select("id,prospect_id,from_email").eq("id", id).maybeSingle();
  if (!t) throw new CrmError("Conversation not found.", 404);
  if (!t.prospect_id) throw new CrmError("This sender isn't a prospect yet. Make them one first, or just mark it handled.", 409);
  await updateProspect(t.prospect_id, { status: "Do Not Contact" });
  await s.from("inbox_threads").update({ intent: "stop", intent_source: "manual", status: "handled", updated_at: now() }).eq("id", id);
  await s.from("crm_notes").insert({ prospect_id: t.prospect_id, type: "note", content: `${who.name} pressed Stop on their reply: marked Do Not Contact, removed from sequences and pending campaigns.` });
  return getThread(id);
}

export async function createProspectFromSender(id: string) {
  const who = actor();
  const s = client();
  const { data: t } = await s.from("inbox_threads").select("*").eq("id", id).maybeSingle();
  if (!t) throw new CrmError("Conversation not found.", 404);
  if (t.prospect_id) throw new CrmError("This conversation is already matched to a prospect.", 409);
  if (!t.from_email) throw new CrmError("No sender address on this conversation.", 400);
  const existing = (await matchAddresses([t.from_email])).get(t.from_email.toLowerCase());
  const prospectId = existing ?? (await createProspect({ company: companyGuess(t.from_email, t.from_name), contact_name: t.from_name, email: t.from_email, source: "Inbox", status: "Replied" })).id;
  await s.from("inbox_threads").update({ prospect_id: prospectId, updated_at: now() }).eq("id", id);
  await logActivity({ entityType: "prospect", entityId: prospectId, action: "inbox_linked", summary: `${who.name} ${existing ? "matched" : "made a prospect from"} ${t.from_email} in the inbox`, service: SVC });
  return getThread(id);
}

// ─── Replies: drafted here, approved by Matt, then a draft in Casey's Gmail ─

export async function draftReply(threadId: string, body: string) {
  const who = actor();
  const text = body.trim();
  if (!text) throw new CrmError("Write the reply first.", 400);
  if (text.length > 20000) throw new CrmError("That reply is too long.", 400);
  const s = client();
  const { data: t } = await s.from("inbox_threads").select("id,subject,from_email,from_name,prospect_id,crm_prospects(company,status)").eq("id", threadId).maybeSingle();
  if (!t) throw new CrmError("Conversation not found.", 404);
  const pros = t.crm_prospects as unknown as { company: string; status: string } | null;
  if (pros?.status === "Do Not Contact") throw new CrmError("This prospect is Do Not Contact. No reply can be drafted.", 409);
  const { data: r, error } = await s.from("inbox_replies").insert({ thread_id: threadId, body: text, status: "pending_approval", created_by: who.name }).select("id").single();
  if (error) throw new CrmError(error.message);
  const res = await perform("inbox.reply_draft", { replyId: r.id }, {
    title: `Reply to ${t.from_name || t.from_email}${pros ? ` (${pros.company})` : ""}`,
    summary: `Re: ${t.subject ?? "(no subject)"}\n\n${text.slice(0, 600)}${text.length > 600 ? "…" : ""}`,
    recommendation: "Approving puts this reply in Casey's Gmail as a draft in the same conversation. It's sent from Gmail, not from here.",
    detail: `To ${t.from_email}. Drafted by ${who.name}.`,
  });
  const itemId = (res as { item?: { id: string } }).item?.id ?? null;
  await s.from("inbox_replies").update({ approval_item_id: itemId, updated_at: now() }).eq("id", r.id);
  if (t.prospect_id) await logActivity({ entityType: "prospect", entityId: t.prospect_id, action: "reply_drafted", summary: `${who.name} drafted a reply to ${t.from_email}; waiting for approval, nothing sent`, service: SVC });
  return getThread(threadId);
}

registerAction("inbox.reply_draft", {
  tier: "red", label: "Put a reply in Casey's Gmail drafts",
  run: async (args) => {
    const s = client();
    const { data: r } = await s.from("inbox_replies").select("*, inbox_threads(gmail_thread_id,subject,from_email,prospect_id)").eq("id", String(args.replyId ?? "")).maybeSingle();
    if (!r) throw new Error("That reply no longer exists.");
    const t = r.inbox_threads as { gmail_thread_id: string; subject: string | null; from_email: string; prospect_id: string | null };
    if (t.prospect_id) {
      const { data: p } = await s.from("crm_prospects").select("status").eq("id", t.prospect_id).maybeSingle();
      if (p?.status === "Do Not Contact") {
        await s.from("inbox_replies").update({ status: "killed", note: "Not drafted: the prospect became Do Not Contact.", updated_at: now() }).eq("id", r.id);
        return "Not drafted: the prospect is now Do Not Contact.";
      }
    }
    if (!(await gmailConfigured())) {
      await s.from("inbox_replies").update({ status: "approved", note: "Approved. Gmail isn't connected yet, so it isn't in Casey's drafts. Copy it from here.", updated_at: now() }).eq("id", r.id);
      return "Approved. Gmail isn't connected yet, so the reply wasn't put in Casey's drafts; it's saved on the conversation.";
    }
    const { data: last } = await s.from("inbox_messages").select("gmail_message_id").eq("thread_id", r.thread_id).eq("direction", "in").order("sent_at", { ascending: false }).limit(1).maybeSingle();
    let inReplyTo: string | null = null, references: string | null = null;
    if (last) {
      try {
        const parsed = parseMessage(await getMessage(last.gmail_message_id));
        inReplyTo = parsed.message_id_header; references = parsed.references;
      } catch { /* threading headers are best-effort; threadId still groups it */ }
    }
    const raw = buildReplyMime({ from: gmailMailbox(), to: t.from_email, subject: t.subject ?? "", body: r.body, inReplyTo, references });
    const draftId = await createDraft(t.gmail_thread_id, raw);
    await s.from("inbox_replies").update({ status: "in_gmail", gmail_draft_id: draftId, note: "In Casey's Gmail drafts, in the same conversation. Send it from Gmail.", updated_at: now() }).eq("id", r.id);
    await s.from("inbox_threads").update({ status: "waiting", updated_at: now() }).eq("id", r.thread_id);
    return "The reply is in Casey's Gmail drafts, in the same conversation. Nothing was sent.";
  },
});

export async function noteInboxKilled(itemId: string) {
  await client().from("inbox_replies").update({ status: "killed", note: "Killed in the Command Center. Not drafted, not sent.", updated_at: now() }).eq("approval_item_id", itemId).eq("status", "pending_approval");
}
