import { db } from "./db";
import { CrmError, logActivity } from "./crm";
import { CLIENTS, SERVICES, REPO_CLIENTS, serviceFromPaths, summaryFromCommit, isSyncMerge } from "./changelogCore";

// The Changelog: the Activity log read as a history of what was done, by day,
// client and service. Dashboard actions log themselves (crm.ts logActivity);
// code shipped to GitHub arrives through the changelog workflow (POST below,
// with the automation token); anything else can be added by hand.

function client() {
  const s = db();
  if (!s) throw new CrmError("Database not configured", 503);
  return s;
}

export interface ChangelogFilter {
  from?: string | null;      // YYYY-MM-DD, inclusive, Central time
  to?: string | null;        // YYYY-MM-DD, inclusive, Central time
  client?: string | null;    // "none" = untagged
  service?: string | null;   // "none" = untagged
  source?: string | null;    // dashboard | github | manual | history
  q?: string | null;
  signIns?: boolean;         // sign-ins are hidden unless asked for
  offset?: number;
  limit?: number;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Start of a Central-time day as an ISO instant (handles CST/CDT).
export function centralDayStart(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 6); // CST midnight
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(guess));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return new Date(guess - hour * 3600_000).toISOString();
}

function nextDay(day: string): string {
  const t = new Date(`${day}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

const escLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listChangelog(f: ChangelogFilter) {
  let q = client().from("activity").select("id, created_at, actor, action, target_type, summary, client, service, link, source", { count: "exact" });
  if (f.from && DAY.test(f.from)) q = q.gte("created_at", centralDayStart(f.from));
  if (f.to && DAY.test(f.to)) q = q.lt("created_at", centralDayStart(nextDay(f.to)));
  if (f.client) q = f.client === "none" ? q.is("client", null) : q.eq("client", f.client);
  if (f.service) q = f.service === "none" ? q.is("service", null) : q.eq("service", f.service);
  if (f.source) q = q.eq("source", f.source);
  if (!f.signIns) q = q.or("target_type.is.null,target_type.neq.session");
  const term = f.q?.trim().slice(0, 100);
  if (term) {
    // PostgREST's or= syntax uses , and () as separators; drop them from the term.
    const safe = escLike(term.replace(/[,()]/g, " "));
    q = q.or(`summary.ilike.%${safe}%,actor.ilike.%${safe}%`);
  }
  const off = Math.max(0, f.offset ?? 0);
  const lim = Math.min(Math.max(1, f.limit ?? 100), 1000);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(off, off + lim - 1);
  if (error) throw new CrmError(error.message);
  return { rows: data ?? [], total: count ?? 0 };
}

// The filter lists: the starter lists plus anything already used in the log.
export async function changelogFacets() {
  const { data, error } = await client().from("activity_tags").select("client, service");
  if (error) throw new CrmError(error.message);
  const used = (k: "client" | "service") => (data ?? []).map((r) => r[k]).filter((v): v is string => !!v);
  const merge = (base: string[], extra: string[]) => [...base, ...[...new Set(extra)].filter((v) => !base.includes(v)).sort()];
  return { clients: merge(CLIENTS, used("client")), services: merge(SERVICES, used("service")) };
}

export async function addChangelogEntry(input: {
  summary?: unknown; client?: unknown; service?: unknown; link?: unknown; date?: unknown; source?: unknown; ref?: unknown;
  repo?: unknown; paths?: unknown; message?: unknown; author?: unknown;
}) {
  // From the GitHub workflow: a commit message, the repo and the files it
  // changed. The client and service are worked out here, so the rules live
  // in one place (changelogCore.ts).
  if (input.source === "github" && typeof input.message === "string" && typeof input.repo === "string") {
    if (isSyncMerge(input.message)) return { ok: true, skipped: true };
    const repo = input.repo;
    const paths = Array.isArray(input.paths) ? input.paths.filter((x): x is string => typeof x === "string").slice(0, 500) : [];
    const { summary, pr } = summaryFromCommit(input.message);
    input = {
      ...input, summary,
      client: input.client ?? REPO_CLIENTS[repo] ?? null,
      service: input.service ?? serviceFromPaths(paths, repo),
      link: pr ? `https://github.com/${repo}/pull/${pr}` : (input.link ?? null),
    };
  }
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  if (!summary) throw new CrmError("Say what was done.", 400);
  if (summary.length > 2000) throw new CrmError("Keep it under 2,000 characters.", 400);
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const link = str(input.link, 500);
  if (link && !/^https:\/\/\S+$/.test(link)) throw new CrmError("The link has to start with https://", 400);
  const source = input.source === "github" ? "github" : "manual";
  const ref = str(input.ref, 200);

  // The GitHub workflow can run twice for the same push; one entry per ref.
  if (ref) {
    const { data, error } = await client().from("activity").select("id").eq("source", source).eq("target_type", "change").filter("changes->>ref", "eq", ref).limit(1);
    if (error) throw new CrmError(error.message);
    if (data?.length) return { ok: true, duplicate: true };
  }

  // A hand entry for an earlier day keeps that day (noon Central).
  const day = str(input.date, 10);
  let createdAt: string | undefined;
  if (day && DAY.test(day) && source === "manual") {
    const at = new Date(centralDayStart(day)).getTime() + 12 * 3600_000;
    if (at < Date.now()) createdAt = new Date(at).toISOString();
  }

  await logActivity({
    entityType: "change", action: source === "github" ? "shipped" : "logged", summary,
    client: str(input.client, 80), service: str(input.service, 80), link, source,
    changes: ref ? { ref } : undefined, createdAt,
    actor: source === "github" ? `GitHub${str(input.author, 60) ? ` (${str(input.author, 60)})` : ""}` : undefined,
  });
  return { ok: true };
}
