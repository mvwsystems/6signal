import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity, matchingIds, updateProspect, stopForProspects, StopKind } from "./crm";
import { ListFilters } from "./crmCore";
import { perform, registerAction, canApprove } from "./commandCenter";
import { firstNameFrom, signatureText, footerText, UNSUB_TOKEN, DEFAULT_SENDING, DEFAULT_COMPLIANCE, SendingSettings, ComplianceSettings } from "./campaignCore";
import { renderSeq, dataFor, canEnroll, dueAt, stepProblems, ProspectLike, SeqData, SEQ_VARS } from "./seqCore";
import { unsubscribeUrl, sendEnabled } from "./campaigns";

// ─────────────────────────────────────────────────────────────────────────────
// C4: sequences and follow-ups.
//
// A sequence is ordered steps (day offset, subject, body). Enrolling a
// prospect drafts step 1 at once (Day 0); each later step is drafted when it
// comes due (the hourly scheduler, or "Draft what's due" on the screen).
// Drafts never send. Each run's new drafts for a sequence become one Red
// approval in the Command Center; approving marks them approved. After Matt
// has approved one batch, he alone can mark the sequence pre-approved, so its
// later drafts are approved as they're made. Approved follow-ups still wait:
// nothing goes out until sending is connected and SEND_ENABLED is on.
// The stop rules (reply, booking, bounce, Do Not Contact) live in crm.ts so
// every status change applies them.
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
function ownerOnly() {
  const a = actor();
  if (!canApprove(a.role)) throw new CrmError("Only Matt can do this.", 403);
  return a;
}
const now = () => new Date().toISOString();
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const SVC = "Sales & proposals";

interface Step { id?: string; step_number: number; day_offset: number; subject: string; body: string }
interface Seq { id: string; name: string; description: string | null; status: string; first_batch_approved: boolean; preapproved: boolean; preapproved_by: string | null; preapproved_at: string | null; legacy_id: number | null; created_at: string; updated_at: string }
const PROSPECT_COLS = "id, company, contact_name, email, city, state, category, status, email_invalid_at";

async function settings(): Promise<{ sending: SendingSettings; compliance: ComplianceSettings }> {
  const { data } = await client().from("settings").select("key,value").in("key", ["sending", "compliance"]);
  const by = new Map((data ?? []).map((r: { key: string; value: Record<string, unknown> }) => [r.key, r.value]));
  const snd = { ...DEFAULT_SENDING, ...(by.get("sending") ?? {}) } as SendingSettings;
  snd.signature = { ...DEFAULT_SENDING.signature, ...((by.get("sending") as { signature?: object })?.signature ?? {}) };
  return { sending: snd, compliance: { ...DEFAULT_COMPLIANCE, ...(by.get("compliance") ?? {}) } as ComplianceSettings };
}

async function getSeq(id: string): Promise<Seq> {
  const { data, error } = await client().from("sequences").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!data) throw new CrmError("Sequence not found.", 404);
  return data as Seq;
}
async function getSteps(id: string): Promise<Step[]> {
  const { data, error } = await client().from("sequence_steps").select("*").eq("sequence_id", id).order("step_number");
  if (error) throw new CrmError(error.message);
  return (data ?? []) as Step[];
}

// ─── Reading ────────────────────────────────────────────────────────────────

export async function listSequences() {
  actor();
  const s = client();
  const [seqs, steps, enr, msgs] = await Promise.all([
    s.from("sequences").select("*").order("name"),
    s.from("sequence_steps").select("sequence_id"),
    s.from("enrollments").select("sequence_id,status"),
    s.from("sequence_messages").select("sequence_id,status"),
  ]);
  for (const r of [seqs, steps, enr, msgs]) if (r.error) throw new CrmError(r.error.message);
  const count = <T extends { sequence_id: string }>(rows: T[], id: string, f: (r: T) => boolean = () => true) => rows.filter((r) => r.sequence_id === id && f(r)).length;
  return {
    send_enabled: sendEnabled(),
    sequences: (seqs.data ?? []).map((q: Seq) => ({
      ...q, steps: count(steps.data ?? [], q.id),
      active: count(enr.data ?? [], q.id, (r: { status: string }) => r.status === "active"),
      paused: count(enr.data ?? [], q.id, (r: { status: string }) => r.status === "paused"),
      drafts: count(msgs.data ?? [], q.id, (r: { status: string }) => r.status === "draft"),
      approved: count(msgs.data ?? [], q.id, (r: { status: string }) => r.status === "approved"),
    })),
  };
}

export async function getSequence(id: string) {
  const me = actor();
  const s = client();
  const seq = await getSeq(id);
  const steps = await getSteps(id);
  const { data: enr, error } = await s.from("enrollments").select("id,prospect_id,status,stop_reason,next_step,next_due_at,enrolled_at,enrolled_by,crm_prospects(company,email,status)").eq("sequence_id", id).order("enrolled_at", { ascending: false }).limit(200);
  if (error) throw new CrmError(error.message);
  const { data: msgs, error: mErr } = await s.from("sequence_messages").select("id,prospect_id,step_number,to_email,subject,body,status,due_at,approval_item_id,note,created_at,decided_at,crm_prospects(company)").eq("sequence_id", id).order("created_at", { ascending: false }).limit(100);
  if (mErr) throw new CrmError(mErr.message);
  return { sequence: seq, steps, enrollments: enr ?? [], messages: msgs ?? [], can_own: canApprove(me.role), vars: SEQ_VARS, send_enabled: sendEnabled() };
}

// ─── Editing ────────────────────────────────────────────────────────────────

export async function saveSequence(input: Record<string, unknown>) {
  const who = actor();
  const s = client();
  const id = str(input.id, 40);
  const name = str(input.name, 120);
  if (!name) throw new CrmError("Give the sequence a name.", 400);
  const raw = Array.isArray(input.steps) ? (input.steps as Record<string, unknown>[]) : [];
  const steps: Step[] = raw.map((r, i) => ({ step_number: i + 1, day_offset: Math.floor(Number(r.day_offset)), subject: str(r.subject, 200), body: typeof r.body === "string" ? r.body.slice(0, 10000) : "" }));
  if (steps.some((x) => !Number.isFinite(x.day_offset) || x.day_offset < 0 || x.day_offset > 365)) throw new CrmError("Each step's day must be between 0 and 365.", 400);
  const problems = stepProblems(steps);
  if (problems.length) throw new CrmError(problems.join(" "), 400);

  let seqId = id;
  if (id) {
    const before = await getSeq(id);
    const old = await getSteps(id);
    const { count } = await s.from("enrollments").select("id", { count: "exact", head: true }).eq("sequence_id", id).in("status", ["active", "paused"]);
    const timingChanged = old.length !== steps.length || old.some((o, i) => o.day_offset !== steps[i].day_offset);
    if ((count ?? 0) > 0 && timingChanged) throw new CrmError(`${count} prospects are in this sequence, so its steps and days can't change. You can still change the wording.`, 409);
    const { error } = await s.from("sequences").update({ name, description: str(input.description, 500) || null, updated_at: now() }).eq("id", id);
    if (error) throw new CrmError(error.message, 400);
    const { error: dErr } = await s.from("sequence_steps").delete().eq("sequence_id", id);
    if (dErr) throw new CrmError(dErr.message);
    await logActivity({ entityType: "sequence", entityId: id, action: "updated", summary: `${who.name} edited sequence "${name}" (${steps.length} steps)`, changes: { from: { name: before.name, steps: old.map(({ step_number, day_offset, subject, body }) => ({ step_number, day_offset, subject, body })) }, to: { name, steps } }, service: SVC });
  } else {
    const { data, error } = await s.from("sequences").insert({ name, description: str(input.description, 500) || null, status: "draft", created_by: who.name }).select("id").single();
    if (error) throw new CrmError(error.message, 400);
    seqId = data.id;
    await logActivity({ entityType: "sequence", entityId: seqId, action: "created", summary: `${who.name} created sequence "${name}" (${steps.length} steps)`, service: SVC });
  }
  const { error: iErr } = await s.from("sequence_steps").insert(steps.map((x) => ({ ...x, sequence_id: seqId })));
  if (iErr) throw new CrmError(iErr.message, 400);
  return getSequence(seqId);
}

export async function setStatus(id: string, status: string) {
  const who = ownerOnly();
  if (!["draft", "active", "archived"].includes(status)) throw new CrmError("Unknown status.", 400);
  const seq = await getSeq(id);
  if (status === "active") {
    const problems = stepProblems(await getSteps(id));
    if (problems.length) throw new CrmError(problems.join(" "), 400);
  }
  if (status === "archived") {
    const { count } = await client().from("enrollments").select("id", { count: "exact", head: true }).eq("sequence_id", id).eq("status", "active");
    if ((count ?? 0) > 0) throw new CrmError(`${count} prospects are still active in it. Pause or remove them first.`, 409);
  }
  await client().from("sequences").update({ status, updated_at: now() }).eq("id", id);
  await logActivity({ entityType: "sequence", entityId: id, action: status, summary: `${who.name} set sequence "${seq.name}" to ${status}`, service: SVC });
  return { ok: true };
}

export async function setPreapproved(id: string, on: boolean) {
  const who = ownerOnly();
  const seq = await getSeq(id);
  if (on && !seq.first_batch_approved) throw new CrmError("Approve one batch of this sequence's follow-ups in the Command Center first.", 409);
  await client().from("sequences").update({ preapproved: on, preapproved_by: on ? who.name : null, preapproved_at: on ? now() : null, updated_at: now() }).eq("id", id);
  await logActivity({ entityType: "sequence", entityId: id, action: on ? "preapproved" : "preapproval_off", summary: on ? `${who.name} pre-approved later follow-ups of "${seq.name}". They're approved as they're drafted; nothing sends while sending is off.` : `${who.name} turned off pre-approval for "${seq.name}". Its drafts need approval again.`, service: SVC });
  return { ok: true };
}

// ─── Preview with a real prospect ──────────────────────────────────────────

async function prospectData(p: ProspectLike, st: { sending: SendingSettings; compliance: ComplianceSettings }, firstName?: string | null): Promise<SeqData> {
  return dataFor(p, { firstName: firstName ?? firstNameFrom(p.contact_name), senderName: st.sending.signature.name || st.sending.from_name, bookingLink: st.compliance.booking_link });
}

async function dmFirstNames(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data, error } = await client().from("crm_contacts").select("prospect_id,name,is_primary").in("prospect_id", ids.slice(i, i + 300)).order("is_primary", { ascending: false });
    if (error) throw new CrmError(error.message);
    for (const c of data ?? []) if (!out.has(c.prospect_id) && firstNameFrom(c.name)) out.set(c.prospect_id, firstNameFrom(c.name)!);
  }
  return out;
}

// The footer goes on every draft: signature only if the step body doesn't
// already sign off with {{senderName}}, then the mailing address and the
// prospect's own unsubscribe link.
function finish(body: string, st: { sending: SendingSettings; compliance: ComplianceSettings }, d: SeqData, unsub: string): string {
  const signsOff = /\{\{\s*sender_?name\s*(\|[^}]*)?\}\}\s*$/i.test(body.trim());
  const text = renderSeq(body, d).trim();
  const sig = signsOff ? signatureText(st.sending, st.compliance).split("\n").slice(1).join("\n") : signatureText(st.sending, st.compliance);
  return `${text}${sig ? `\n${signsOff ? "" : "\n"}${sig}` : ""}\n\n${footerText(st.compliance)}`.split(UNSUB_TOKEN).join(unsub);
}

export async function previewSequence(input: { id?: unknown; steps?: unknown; prospect_id?: unknown; q?: unknown }) {
  actor();
  const s = client();
  const steps: Step[] = Array.isArray(input.steps) ? (input.steps as Step[]) : await getSteps(str(input.id, 40));
  let p: ProspectLike | null = null;
  const pid = str(input.prospect_id, 40);
  if (pid) {
    const r = await s.from("crm_prospects").select(PROSPECT_COLS).eq("id", pid).maybeSingle();
    p = r.data as ProspectLike | null;
  } else {
    const q = str(input.q, 80).replace(/[,()*%"\\]/g, " ").trim();
    let qy = s.from("crm_prospects").select(PROSPECT_COLS).not("email", "is", null).neq("status", "Do Not Contact");
    if (q) qy = qy.ilike("company", `%${q}%`);
    const r = await qy.order("lead_score", { ascending: false }).limit(1).maybeSingle();
    p = r.data as ProspectLike | null;
  }
  if (!p) throw new CrmError("No prospect to preview with. Try another name.", 404);
  const st = await settings();
  const fn = firstNameFrom(p.contact_name) ?? (await dmFirstNames([p.id])).get(p.id) ?? null;
  const d = await prospectData(p, st, fn);
  const elig = canEnroll(p, steps, d, false);
  return {
    prospect: { id: p.id, company: p.company, first_name: fn, email: p.email, status: p.status },
    eligible: elig.ok, reason: elig.ok ? null : elig.reason,
    steps: steps.map((x) => ({ step_number: x.step_number, day_offset: x.day_offset, subject: renderSeq(x.subject, d), body: finish(x.body, st, d, `https://6signal.co/api/unsubscribe?t=preview`) })),
  };
}

// ─── Enrollment ─────────────────────────────────────────────────────────────

async function targetIds(input: Record<string, unknown>): Promise<{ ids: string[]; source: string; campaign_id: string | null }> {
  const s = client();
  if (Array.isArray(input.prospect_ids) && input.prospect_ids.length) return { ids: (input.prospect_ids as unknown[]).map(String).slice(0, 5000), source: input.prospect_ids.length === 1 ? "the prospect's page" : "a selection", campaign_id: null };
  const viewId = str(input.view_id, 40);
  if (viewId) {
    const { data, error } = await s.from("crm_saved_views").select("name,filters").eq("id", viewId).maybeSingle();
    if (error) throw new CrmError(error.message);
    if (!data) throw new CrmError("That saved view no longer exists.", 404);
    return { ids: await matchingIds({ ...(data.filters as ListFilters), page: undefined, pageSize: undefined }), source: `saved view "${data.name}"`, campaign_id: null };
  }
  const campId = str(input.campaign_id, 40);
  if (campId) {
    const { data: c } = await s.from("campaigns").select("name").eq("id", campId).maybeSingle();
    if (!c) throw new CrmError("Campaign not found.", 404);
    const ids: string[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await s.from("campaign_recipients").select("prospect_id").eq("campaign_id", campId).neq("status", "skipped").order("id").range(from, from + 999);
      if (error) throw new CrmError(error.message);
      ids.push(...(data ?? []).map((r: { prospect_id: string }) => r.prospect_id));
      if (!data || data.length < 1000) break;
    }
    return { ids, source: `campaign "${c.name}"`, campaign_id: campId };
  }
  throw new CrmError("Pick who to enroll: a prospect, a saved view or a campaign.", 400);
}

async function sortEligible(seqId: string, ids: string[]) {
  const s = client();
  const steps = await getSteps(seqId);
  const st = await settings();
  const live = new Set<string>();
  const rows: ProspectLike[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const chunk = ids.slice(i, i + 300);
    const [p, e] = await Promise.all([
      s.from("crm_prospects").select(PROSPECT_COLS).in("id", chunk),
      s.from("enrollments").select("prospect_id").eq("sequence_id", seqId).in("status", ["active", "paused"]).in("prospect_id", chunk),
    ]);
    if (p.error) throw new CrmError(p.error.message);
    if (e.error) throw new CrmError(e.error.message);
    rows.push(...((p.data ?? []) as ProspectLike[]));
    for (const r of e.data ?? []) live.add(r.prospect_id);
  }
  const dm = await dmFirstNames(rows.filter((r) => !firstNameFrom(r.contact_name)).map((r) => r.id));
  const eligible: string[] = [];
  const skipped: Record<string, string[]> = {};
  for (const p of rows) {
    const d = await prospectData(p, st, firstNameFrom(p.contact_name) ?? dm.get(p.id) ?? null);
    const r = canEnroll(p, steps, d, live.has(p.id));
    if (r.ok) eligible.push(p.id);
    else (skipped[r.reason] ??= []).push(p.company);
  }
  return { eligible, skipped };
}

// Step 1 of a bulk enroll: who would be enrolled and who is skipped, by reason.
export async function checkEnroll(input: Record<string, unknown>) {
  actor();
  const seq = await getSeq(str(input.sequence_id, 40));
  const t = await targetIds(input);
  const { eligible, skipped } = await sortEligible(seq.id, t.ids);
  return {
    sequence: seq.name, status: seq.status, source: t.source, matched: t.ids.length, eligible: eligible.length,
    skipped: Object.entries(skipped).map(([reason, names]) => ({ reason, count: names.length, examples: names.slice(0, 5) })),
  };
}

// Step 2: enroll, refusing if the eligible count moved since the check.
export async function enroll(input: Record<string, unknown>) {
  const who = actor();
  const seq = await getSeq(str(input.sequence_id, 40));
  if (seq.status !== "active") throw new CrmError(`"${seq.name}" is a ${seq.status}. Matt makes a sequence active before anyone can be enrolled.`, 409);
  const t = await targetIds(input);
  const { eligible, skipped } = await sortEligible(seq.id, t.ids);
  const expected = Number(input.expected_count);
  if (t.ids.length > 1 && expected !== eligible.length) throw new CrmError(`The count changed: you confirmed ${expected}, now ${eligible.length} can be enrolled. Nothing was enrolled; check again.`, 409);
  if (!eligible.length) throw new CrmError(`Nobody here can be enrolled: ${Object.entries(skipped).map(([r, n]) => `${n.length} ${r}`).join("; ")}.`, 409);
  const at = new Date();
  const rows = eligible.map((pid) => ({ sequence_id: seq.id, prospect_id: pid, campaign_id: t.campaign_id, status: "active", next_step: 1, next_due_at: at.toISOString(), enrolled_by: who.name, enrolled_at: at.toISOString() }));
  const ids: string[] = [];
  for (let i = 0; i < rows.length; i += 500) {
    const { data, error } = await client().from("enrollments").insert(rows.slice(i, i + 500)).select("id");
    if (error) throw new CrmError(error.message.includes("enrollments_live_uniq") ? "Someone here was enrolled a moment ago. Check again." : error.message, 409);
    ids.push(...(data ?? []).map((r: { id: string }) => r.id));
  }
  if (eligible.length === 1) await logActivity({ entityType: "prospect", entityId: eligible[0], action: "enrolled", summary: `${who.name} enrolled this prospect in "${seq.name}"`, service: SVC });
  await logActivity({ entityType: "sequence", entityId: seq.id, action: "enrolled", summary: `${who.name} enrolled ${eligible.length} prospect${eligible.length === 1 ? "" : "s"} in "${seq.name}" from ${t.source}${Object.keys(skipped).length ? `; skipped ${Object.values(skipped).flat().length}` : ""}`, service: SVC });
  const drafted = await draftDue({ enrollmentIds: ids });
  return { enrolled: eligible.length, skipped: Object.entries(skipped).map(([reason, names]) => ({ reason, count: names.length })), ...drafted };
}

// ─── Drafting what's due ────────────────────────────────────────────────────

const DRAFT_RUN_LIMIT = 500;

export async function draftDue(opts: { enrollmentIds?: string[] } = {}) {
  const s = client();
  let q = s.from("enrollments").select("id,sequence_id,prospect_id,next_step,enrolled_at").eq("status", "active").not("next_step", "is", null).lte("next_due_at", now()).order("next_due_at").limit(DRAFT_RUN_LIMIT);
  if (opts.enrollmentIds) q = q.in("id", opts.enrollmentIds);
  const { data: due, error } = await q;
  if (error) throw new CrmError(error.message);
  if (!due?.length) return { drafted: 0, approvals: 0, preapproved: 0 };
  const st = await settings();
  const seqIds = Array.from(new Set(due.map((e) => e.sequence_id)));
  const seqs = new Map<string, Seq>();
  const stepsBy = new Map<string, Step[]>();
  for (const id of seqIds) { seqs.set(id, await getSeq(id)); stepsBy.set(id, await getSteps(id)); }
  const pros = new Map<string, ProspectLike>();
  const pids = Array.from(new Set(due.map((e) => e.prospect_id)));
  for (let i = 0; i < pids.length; i += 300) {
    const { data, error: pErr } = await s.from("crm_prospects").select(PROSPECT_COLS).in("id", pids.slice(i, i + 300));
    if (pErr) throw new CrmError(pErr.message);
    for (const p of data ?? []) pros.set(p.id, p as ProspectLike);
  }
  const dm = await dmFirstNames(pids.filter((id) => !firstNameFrom(pros.get(id)?.contact_name)));

  const made = new Map<string, string[]>(); // sequence → new draft ids
  for (const e of due) {
    const steps = stepsBy.get(e.sequence_id)!;
    const step = steps.find((x) => x.step_number === e.next_step);
    const p = pros.get(e.prospect_id);
    const seq = seqs.get(e.sequence_id)!;
    if (!step || !p || seq.status !== "active") {
      await s.from("enrollments").update({ status: "paused", stop_reason: !p ? "prospect missing" : seq.status !== "active" ? "sequence not active" : "step missing", next_due_at: null, updated_at: now() }).eq("id", e.id);
      continue;
    }
    // A prospect who hit a stop rule since enrolling is caught here too.
    const d = await prospectData(p, st, firstNameFrom(p.contact_name) ?? dm.get(p.id) ?? null);
    const elig = canEnroll(p, [step], d, false);
    if (!elig.ok) {
      await s.from("enrollments").update({ status: p.status === "Do Not Contact" ? "removed" : "paused", stop_reason: elig.reason, next_due_at: null, updated_at: now() }).eq("id", e.id);
      continue;
    }
    const dueAtIso = dueAt(new Date(e.enrolled_at), step.day_offset).toISOString();
    const { data: m, error: mErr } = await s.from("sequence_messages").insert({
      enrollment_id: e.id, sequence_id: e.sequence_id, prospect_id: p.id, step_number: step.step_number, to_email: p.email!,
      subject: renderSeq(step.subject, d), body: finish(step.body, st, d, unsubscribeUrl(p.id) ?? ""), status: "draft", due_at: dueAtIso,
    }).select("id").maybeSingle();
    if (mErr && !mErr.message.includes("duplicate")) throw new CrmError(mErr.message);
    if (m) (made.get(e.sequence_id) ?? made.set(e.sequence_id, []).get(e.sequence_id)!).push(m.id);
    const next = steps.find((x) => x.step_number > step.step_number);
    await s.from("enrollments").update(next
      ? { next_step: next.step_number, next_due_at: dueAt(new Date(e.enrolled_at), next.day_offset).toISOString(), updated_at: now() }
      : { status: "finished", next_step: null, next_due_at: null, updated_at: now() }).eq("id", e.id);
  }

  let approvals = 0, preapproved = 0;
  for (const [seqId, ids] of made) {
    if (!ids.length) continue;
    const seq = seqs.get(seqId)!;
    if (seq.preapproved) {
      await s.from("sequence_messages").update({ status: "approved", decided_at: now(), note: `Pre-approved (${seq.preapproved_by ?? "Matt"}). Not sent: sending isn't connected for follow-ups yet.` }).in("id", ids);
      await logActivity({ entityType: "sequence", entityId: seqId, action: "drafted", summary: `${ids.length} follow-up draft${ids.length === 1 ? "" : "s"} for "${seq.name}" approved under pre-approval; nothing sent`, service: SVC });
      preapproved += ids.length;
      continue;
    }
    const firstStep = await s.from("sequence_messages").select("step_number,crm_prospects(company)").in("id", ids).limit(3);
    const names = (firstStep.data ?? []).map((r) => (r.crm_prospects as unknown as { company: string } | null)?.company).filter(Boolean).join(", ");
    const res = await perform("sequence.approve_batch", { sequenceId: seqId, messageIds: ids }, {
      title: `Approve ${ids.length} follow-up draft${ids.length === 1 ? "" : "s"} for "${seq.name}"`,
      summary: `${ids.length} draft${ids.length === 1 ? "" : "s"} from "${seq.name}"${names ? `, including ${names}` : ""}. Read them on the Sequences tab.`,
      recommendation: "Approving marks them approved. Nothing sends yet: follow-up sending isn't connected and SEND_ENABLED is off.",
      detail: "Kill to reject these drafts; the prospects stay enrolled for later steps.",
    });
    const itemId = (res as { item?: { id: string } }).item?.id ?? null;
    if (itemId) await s.from("sequence_messages").update({ approval_item_id: itemId }).in("id", ids);
    approvals++;
  }
  return { drafted: Array.from(made.values()).flat().length, approvals, preapproved };
}

registerAction("sequence.approve_batch", {
  tier: "red", label: "Approve follow-up drafts",
  run: async (args) => {
    const s = client();
    const ids = Array.isArray(args.messageIds) ? (args.messageIds as string[]) : [];
    const seqId = String(args.sequenceId ?? "");
    const { data } = await s.from("sequence_messages").update({ status: "approved", decided_at: now(), note: `Approved. Not sent: sending isn't connected for follow-ups yet${sendEnabled() ? "" : ", and SEND_ENABLED is off"}.` }).in("id", ids).eq("status", "draft").select("id");
    await s.from("sequences").update({ first_batch_approved: true, updated_at: now() }).eq("id", seqId);
    const n = data?.length ?? 0;
    const gone = ids.length - n;
    return `${n} follow-up draft${n === 1 ? "" : "s"} approved${gone ? ` (${gone} had been cancelled by a stop rule)` : ""}. Nothing was sent.`;
  },
});

export async function noteSeqKilled(itemId: string) {
  await client().from("sequence_messages").update({ status: "rejected", decided_at: now(), note: "Killed in the Command Center. Not sent." }).eq("approval_item_id", itemId).eq("status", "draft");
}

// ─── The prospect's timeline and its buttons ───────────────────────────────

export async function prospectTimeline(prospectId: string) {
  actor();
  const s = client();
  const [enr, msgs, seqs] = await Promise.all([
    s.from("enrollments").select("id,sequence_id,status,stop_reason,next_step,next_due_at,enrolled_at,enrolled_by,updated_at,sequences(name)").eq("prospect_id", prospectId).order("enrolled_at", { ascending: false }),
    s.from("sequence_messages").select("id,enrollment_id,step_number,subject,body,status,due_at,note,created_at,decided_at,sent_at").eq("prospect_id", prospectId).order("step_number"),
    s.from("sequences").select("id,name,status").eq("status", "active").order("name"),
  ]);
  for (const r of [enr, msgs, seqs]) if (r.error) throw new CrmError(r.error.message);
  return { enrollments: enr.data ?? [], messages: msgs.data ?? [], active_sequences: seqs.data ?? [] };
}

export async function enrollmentAction(id: string, op: "pause" | "resume" | "remove") {
  const who = actor();
  const s = client();
  const res = await s.from("enrollments").select(`*, sequences(name), crm_prospects(${PROSPECT_COLS})`).eq("id", id).maybeSingle();
  const { error } = res;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = res.data as any;
  if (error) throw new CrmError(error.message);
  if (!e) throw new CrmError("Enrollment not found.", 404);
  const seqName = (e.sequences as { name: string } | null)?.name ?? "the sequence";
  if (op === "pause") {
    if (e.status !== "active") throw new CrmError("Only an active enrollment can be paused.", 409);
    await s.from("enrollments").update({ status: "paused", stop_reason: "manual", next_due_at: null, updated_at: now() }).eq("id", id);
  } else if (op === "remove") {
    await s.from("enrollments").update({ status: "removed", stop_reason: "manual", next_due_at: null, updated_at: now() }).eq("id", id);
    await s.from("sequence_messages").update({ status: "cancelled", note: `Removed from the sequence by ${who.name}. Not sent.`, decided_at: now() }).eq("enrollment_id", id).in("status", ["draft", "approved"]);
  } else {
    if (e.status !== "paused") throw new CrmError("Only a paused enrollment can be resumed.", 409);
    const p = e.crm_prospects as unknown as ProspectLike;
    const steps = await getSteps(e.sequence_id);
    const st = await settings();
    const d = await prospectData(p, st, firstNameFrom(p.contact_name) ?? (await dmFirstNames([p.id])).get(p.id) ?? null);
    const remaining = steps.filter((x) => x.step_number >= (e.next_step ?? Infinity));
    const r = canEnroll(p, remaining.length ? remaining : steps, d, false);
    if (!r.ok) throw new CrmError(`Can't resume: ${r.reason}.`, 409);
    if (!remaining.length) {
      await s.from("enrollments").update({ status: "finished", stop_reason: null, updated_at: now() }).eq("id", id);
    } else {
      // Resuming doesn't send a pile of overdue steps at once: the next step
      // is due now and the ones after keep their spacing from it.
      const shift = Date.now() - dueAt(new Date(e.enrolled_at), remaining[0].day_offset).getTime();
      const enrolledAt = shift > 0 ? new Date(new Date(e.enrolled_at).getTime() + shift) : new Date(e.enrolled_at);
      await s.from("enrollments").update({ status: "active", stop_reason: null, enrolled_at: enrolledAt.toISOString(), next_due_at: dueAt(enrolledAt, remaining[0].day_offset).toISOString(), updated_at: now() }).eq("id", id);
    }
  }
  await logActivity({ entityType: "prospect", entityId: e.prospect_id, action: `sequence_${op}`, summary: `${who.name} ${op === "pause" ? "paused" : op === "remove" ? "removed this prospect from" : "resumed"} "${seqName}"`, service: SVC });
  if (op === "resume") await draftDue({ enrollmentIds: [id] });
  return { ok: true };
}

// Events the inbox (C5) and Calendly sync (C6) will record on their own. Until
// then they're buttons on the prospect, so the stop rules can be used and tested.
export async function recordEvent(prospectId: string, kind: "reply" | "booking" | "bounce") {
  const who = actor();
  const s = client();
  const { data: p } = await s.from("crm_prospects").select("id,company,status,email").eq("id", prospectId).maybeSingle();
  if (!p) throw new CrmError("Prospect not found.", 404);
  if (kind === "reply") {
    if (!["Replied", "Interested", "Not now", "Do Not Contact", "Customer"].includes(p.status)) await updateProspect(prospectId, { status: "Replied" });
    else await stopForProspects([prospectId], "reply", "marked as replied");
    await s.from("crm_notes").insert({ prospect_id: prospectId, type: "reply", content: `${who.name} marked a reply. Sequences paused.` });
  } else if (kind === "booking") {
    await stopForProspects([prospectId], "booking", "marked as booked");
    await s.from("crm_notes").insert({ prospect_id: prospectId, type: "booking", content: `${who.name} marked a booking. Sequences paused.` });
  } else {
    await s.from("crm_prospects").update({ email_invalid_at: now(), updated_at: now() }).eq("id", prospectId);
    await stopForProspects([prospectId], "bounce" as StopKind, `${p.email ?? "email"} bounced`);
    await s.from("crm_notes").insert({ prospect_id: prospectId, type: "bounce", content: `${who.name} marked ${p.email ?? "the email"} as bounced. It's flagged invalid and sequences are paused.` });
  }
  await logActivity({ entityType: "prospect", entityId: prospectId, action: kind, summary: `${who.name} recorded a ${kind} for ${p.company}`, service: SVC });
  return prospectTimeline(prospectId);
}

export async function clearBounce(prospectId: string) {
  const who = actor();
  await client().from("crm_prospects").update({ email_invalid_at: null, updated_at: now() }).eq("id", prospectId);
  await logActivity({ entityType: "prospect", entityId: prospectId, action: "bounce_cleared", summary: `${who.name} cleared the bounced-email flag`, service: SVC });
  return { ok: true };
}
