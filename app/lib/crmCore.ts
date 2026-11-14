// Pure CRM logic shared by the API routes, the dashboard UI and the Manus
// loader script: field lists, normalization, CSV parsing, column mapping,
// import verdicts and duplicate clustering. No database or network here, so
// every rule that decides "is this a duplicate?" can be read and tested alone.

export const STATUSES = [
  "Never contacted", "Contacted", "Replied", "Interested", "Not now",
  "Do Not Contact", "Customer", "Dead", "Closed",
] as const;
export type Status = (typeof STATUSES)[number];

export const DEAL_STAGES = ["New Lead", "Audit Sent", "Proposal Out", "Negotiating", "Closed Won", "Closed Lost"] as const;
export const SERVICE_ANGLES = ["Website Lead", "AI Visibility Lead", "AI Infrastructure Lead"] as const;

export const CATEGORIES = [
  "General Contractor", "Civil & Heavy Construction", "Road & Infrastructure Contractor",
  "Utility Contractor", "Specialty Trade Contractor", "Engineering & Surveying",
  "Architecture & Design", "Materials & Equipment Supplier", "Developer / Owner",
  "Government / Public Agency", "Construction Contractor (Unspecified)",
  "Construction Services / Trade Unspecified",
] as const;

export interface Prospect {
  id: string;
  legacy_id: number | null;
  company: string;
  contact_name: string | null;
  contact_title: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  website_domain: string | null;
  linkedin: string | null;
  category: string | null;
  service_angle: string | null;
  primary_service: string | null;
  primary_sub_service: string | null;
  addon_services: string[];
  status: string;
  tags: string[];
  lead_score: number;
  priority_call_rank: number | null;
  estimated_revenue: string | null;
  company_size: string | null;
  source: string | null;
  notes: string | null;
  deal_stage: string;
  deal_value: number;
  follow_up_count: number;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fields the drawer may edit inline. Anything else is system-owned.
export const EDITABLE_FIELDS = [
  "company", "contact_name", "contact_title", "email", "phone", "city", "state", "zip",
  "website", "linkedin", "category", "service_angle", "primary_service", "primary_sub_service",
  "status", "tags", "lead_score", "priority_call_rank", "estimated_revenue", "company_size",
  "source", "notes", "deal_stage", "deal_value", "last_contact_at",
] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];

// Columns an import can fill, with the header spellings that auto-map to each.
export const IMPORT_FIELDS: { key: EditableField; label: string; aliases: string[] }[] = [
  { key: "company", label: "Company", aliases: ["company", "company name", "companyname", "business", "business name", "organization", "account"] },
  { key: "contact_name", label: "Contact name", aliases: ["contact", "contact name", "contactname", "name", "full name", "owner", "first and last name"] },
  { key: "contact_title", label: "Contact title", aliases: ["title", "contact title", "job title", "position", "role"] },
  { key: "email", label: "Email", aliases: ["email", "email address", "e-mail", "contact email", "work email"] },
  { key: "phone", label: "Phone", aliases: ["phone", "phone number", "telephone", "mobile", "cell", "office phone"] },
  { key: "city", label: "City", aliases: ["city", "town", "location city"] },
  { key: "state", label: "State", aliases: ["state", "st", "province", "region"] },
  { key: "zip", label: "ZIP", aliases: ["zip", "zipcode", "zip code", "postal code", "postcode"] },
  { key: "website", label: "Website", aliases: ["website", "url", "site", "web", "domain", "company website"] },
  { key: "linkedin", label: "LinkedIn", aliases: ["linkedin", "linkedin url", "linkedinurl", "linkedin profile"] },
  { key: "category", label: "Category", aliases: ["category", "industry", "trade", "vertical", "segment"] },
  { key: "service_angle", label: "Service angle", aliases: ["service angle", "service type", "angle", "lead type"] },
  { key: "status", label: "Status", aliases: ["status", "contact status", "stage status"] },
  { key: "tags", label: "Tags (separate with |)", aliases: ["tags", "tag", "labels", "lists"] },
  { key: "lead_score", label: "Lead score", aliases: ["lead score", "score", "leadscore"] },
  { key: "source", label: "Source", aliases: ["source", "lead source", "list", "origin"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "comments", "description"] },
  { key: "deal_value", label: "Deal value", aliases: ["deal value", "value", "amount", "deal amount"] },
];

// ─── Normalization ──────────────────────────────────────────────────────────

const FREE_MAIL = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "live.com",
  "msn.com", "att.net", "sbcglobal.net", "comcast.net", "verizon.net", "me.com", "ymail.com",
  "protonmail.com", "proton.me", "mail.com", "gmx.com", "charter.net", "cox.net", "bellsouth.net",
]);

export function normEmail(e?: string | null): string | null {
  const v = (e ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}

// "HTTPS://www.Acme.com/about" → "acme.com"
export function domainOf(url?: string | null): string | null {
  if (!url) return null;
  const d = url.trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#:].*$/, "")
    .replace(/\.+$/, "");
  return d && d.includes(".") ? d : null;
}

// Company domain for dedupe: the website's host, else the email's domain when
// it is a business domain (two plumbers on gmail are not the same company).
export function companyDomain(website?: string | null, email?: string | null): string | null {
  const w = domainOf(website);
  if (w) return w;
  const e = normEmail(email);
  if (!e) return null;
  const d = e.split("@")[1];
  return FREE_MAIL.has(d) ? null : d;
}

const SUFFIXES = new Set([
  "inc", "incorporated", "llc", "l", "c", "lp", "llp", "ltd", "co", "corp", "corporation",
  "company", "the", "pllc", "pc", "group", "and", "of",
]);

// "Thos. S. Byrne, Inc." → "thos s byrne"
export function normCompany(name?: string | null): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !SUFFIXES.has(w))
    .join(" ");
}

export function normPhone(p?: string | null): string | null {
  const d = (p ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d.length >= 10 ? d : null;
}

// ─── CSV ────────────────────────────────────────────────────────────────────

// RFC 4180: quoted fields, escaped quotes (""), commas and newlines inside quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

export type Mapping = Partial<Record<EditableField, number>>; // field → column index

export function suggestMapping(headers: string[]): Mapping {
  const clean = headers.map((h) => h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "));
  const m: Mapping = {};
  const used = new Set<number>();
  for (const f of IMPORT_FIELDS) {
    const idx = clean.findIndex((h, i) => !used.has(i) && f.aliases.includes(h));
    if (idx >= 0) { m[f.key] = idx; used.add(idx); }
  }
  return m;
}

export type ImportRecord = Partial<Record<EditableField, unknown>>;

export function applyMapping(row: string[], mapping: Mapping): ImportRecord {
  const rec: ImportRecord = {};
  for (const [field, idx] of Object.entries(mapping) as [EditableField, number][]) {
    const raw = (row[idx] ?? "").trim();
    if (!raw) continue;
    if (field === "tags") rec.tags = raw.split(/\s*[|;]\s*/).filter(Boolean);
    else if (field === "lead_score" || field === "deal_value") {
      const n = Number(raw.replace(/[$,]/g, ""));
      if (Number.isFinite(n)) rec[field] = n;
    } else if (field === "status" || field === "service_angle") {
      const options: readonly string[] = field === "status" ? STATUSES : SERVICE_ANGLES;
      rec[field] = options.find((o) => o.toLowerCase() === raw.toLowerCase()) ?? raw;
    } else rec[field] = raw;
  }
  return rec;
}

// ─── Import verdicts ────────────────────────────────────────────────────────

export type Verdict = "new" | "duplicate-in-file" | "duplicate-in-db" | "invalid";

export interface RowVerdict {
  row: number;            // 1-based data row (header excluded)
  verdict: Verdict;
  reason: string;
  matchRow?: number;      // for duplicate-in-file: the earlier row it repeats
  existingId?: string;    // for duplicate-in-db
  existingCompany?: string;
}

export interface DedupeKey { id: string; company: string; email: string | null; website: string | null; phone?: string | null }

export function validateRecord(r: ImportRecord): string | null {
  if (!String(r.company ?? "").trim()) return "No company name";
  if (r.email != null && !normEmail(String(r.email))) return `Email "${String(r.email)}" is not valid`;
  if (r.status != null && !(STATUSES as readonly string[]).includes(String(r.status))) return `Status "${String(r.status)}" is not a known status`;
  if (r.service_angle != null && !(SERVICE_ANGLES as readonly string[]).includes(String(r.service_angle))) return `Service angle "${String(r.service_angle)}" is not known`;
  return null;
}

interface KeyIndex { email: Map<string, number>; domain: Map<string, number>; name: Map<string, number> }

function keysOf(company: unknown, email: unknown, website: unknown) {
  return {
    email: normEmail(email as string | null),
    domain: companyDomain(website as string | null, email as string | null),
    name: normCompany(company as string | null) || null,
  };
}

// Each row gets exactly one verdict. Matching order: same email, then same
// company domain, then same normalized company name. Nothing is merged here;
// the verdicts only decide what a commit inserts and what it reports.
export function computeVerdicts(records: ImportRecord[], existing: DedupeKey[]): RowVerdict[] {
  const db: { email: Map<string, DedupeKey>; domain: Map<string, DedupeKey>; name: Map<string, DedupeKey> } = { email: new Map(), domain: new Map(), name: new Map() };
  for (const e of existing) {
    const k = keysOf(e.company, e.email, e.website);
    if (k.email && !db.email.has(k.email)) db.email.set(k.email, e);
    if (k.domain && !db.domain.has(k.domain)) db.domain.set(k.domain, e);
    if (k.name && !db.name.has(k.name)) db.name.set(k.name, e);
  }
  const seen: KeyIndex = { email: new Map(), domain: new Map(), name: new Map() };
  return records.map((r, i) => {
    const row = i + 1;
    const bad = validateRecord(r);
    if (bad) return { row, verdict: "invalid", reason: bad };
    const k = keysOf(r.company, r.email, r.website);
    const checks: [keyof KeyIndex, string | null, string][] = [
      ["email", k.email, "same email"], ["domain", k.domain, "same website domain"], ["name", k.name, "same company name"],
    ];
    for (const [kind, val, why] of checks) {
      if (val && seen[kind].has(val)) return { row, verdict: "duplicate-in-file", reason: `${why} as row ${seen[kind].get(val)}`, matchRow: seen[kind].get(val) };
    }
    for (const [kind, val, why] of checks) {
      const hit = val ? db[kind].get(val) : undefined;
      if (hit) return { row, verdict: "duplicate-in-db", reason: `${why} as "${hit.company}"`, existingId: hit.id, existingCompany: hit.company };
    }
    for (const [kind, val] of checks) if (val) seen[kind].set(val, row);
    return { row, verdict: "new", reason: "No match" };
  });
}

// ─── Duplicate clusters (existing records) ──────────────────────────────────

export interface Cluster { reason: string; key: string; ids: string[] }

// Groups records that share an email, a company domain, or a normalized
// company name. A record can appear in more than one cluster; the UI shows
// each cluster on its own and merges are always chosen by a person.
export function findClusters(rows: DedupeKey[]): Cluster[] {
  const groups = new Map<string, { reason: string; key: string; ids: string[] }>();
  const add = (reason: string, key: string | null, id: string) => {
    if (!key) return;
    const g = groups.get(`${reason}:${key}`) ?? { reason, key, ids: [] };
    g.ids.push(id);
    groups.set(`${reason}:${key}`, g);
  };
  for (const r of rows) {
    const k = keysOf(r.company, r.email, r.website);
    add("Same email", k.email, r.id);
    add("Same website domain", k.domain, r.id);
    add("Same company name", k.name, r.id);
    add("Same phone", normPhone(r.phone ?? null), r.id);
  }
  // Drop singletons, and drop a cluster whose members exactly repeat a
  // stronger cluster already listed (email beats domain beats name beats phone).
  const order = ["Same email", "Same website domain", "Same company name", "Same phone"];
  const out: Cluster[] = [];
  const seenSets = new Set<string>();
  for (const reason of order) {
    for (const g of groups.values()) {
      if (g.reason !== reason || g.ids.length < 2) continue;
      const sig = [...g.ids].sort().join(",");
      if (seenSets.has(sig)) continue;
      seenSets.add(sig);
      out.push(g);
    }
  }
  return out.sort((a, b) => b.ids.length - a.ids.length || order.indexOf(a.reason) - order.indexOf(b.reason));
}

// The survivor keeps its own values; blanks are filled from the merged record,
// tags and add-ons are unioned, notes are appended so no text is lost.
export function mergeRecords(survivor: Prospect, merged: Prospect): Partial<Prospect> {
  const patch: Partial<Prospect> = {};
  const fillable: (keyof Prospect)[] = [
    "contact_name", "contact_title", "email", "phone", "city", "state", "zip", "website", "website_domain",
    "linkedin", "category", "service_angle", "primary_service", "primary_sub_service", "priority_call_rank",
    "estimated_revenue", "company_size", "source", "last_contact_at",
  ];
  for (const f of fillable) {
    const s = survivor[f];
    const m = merged[f];
    if ((s == null || s === "") && m != null && m !== "") (patch as Record<string, unknown>)[f] = m;
  }
  const union = (a: string[], b: string[]) => Array.from(new Set([...(a ?? []), ...(b ?? [])]));
  const tags = union(survivor.tags, merged.tags);
  if (tags.length !== (survivor.tags ?? []).length) patch.tags = tags;
  const addons = union(survivor.addon_services, merged.addon_services);
  if (addons.length !== (survivor.addon_services ?? []).length) patch.addon_services = addons;
  const sn = (survivor.notes ?? "").trim();
  const mn = (merged.notes ?? "").trim();
  if (mn && !sn.includes(mn)) patch.notes = sn ? `${sn}\n\n[Merged from ${merged.company}] ${mn}` : mn;
  if ((merged.lead_score ?? 0) > (survivor.lead_score ?? 0)) patch.lead_score = merged.lead_score;
  if (Number(merged.deal_value ?? 0) > Number(survivor.deal_value ?? 0)) patch.deal_value = merged.deal_value;
  return patch;
}

// Field-level diff for the activity log: { field: { from, to } }.
export function diff(before: Record<string, unknown>, patch: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const [k, to] of Object.entries(patch)) {
    const from = before[k] ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to ?? null)) out[k] = { from, to: to ?? null };
  }
  return out;
}

// ─── List filters ───────────────────────────────────────────────────────────

export interface ListFilters {
  q?: string;
  status?: string[];
  category?: string;
  state?: string;
  tags?: string[];
  angle?: string;
  has?: ("email" | "phone" | "contacts")[]; // only prospects that have these
  sort?: "company" | "lead_score" | "last_contact_at" | "created_at" | "updated_at";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export function filtersFromParams(p: URLSearchParams): ListFilters {
  const list = (k: string) => p.getAll(k).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  const sortOk = ["company", "lead_score", "last_contact_at", "created_at", "updated_at"];
  const sort = p.get("sort") ?? "company";
  return {
    q: p.get("q")?.trim() || undefined,
    status: list("status"),
    category: p.get("category") || undefined,
    state: p.get("state") || undefined,
    tags: list("tags"),
    angle: p.get("angle") || undefined,
    has: list("has").filter((h): h is "email" | "phone" | "contacts" => h === "email" || h === "phone" || h === "contacts"),
    sort: (sortOk.includes(sort) ? sort : "company") as ListFilters["sort"],
    dir: p.get("dir") === "desc" ? "desc" : "asc",
    page: Math.max(1, Number(p.get("page")) || 1),
    pageSize: Math.min(200, Math.max(10, Number(p.get("pageSize")) || 50)),
  };
}

// ─── Manus CRM export → CRM rows ───────────────────────────────────────────
// One shared mapping of the Manus export file, used by the dashboard's one-time
// "Load Manus export" panel and by scripts/load-manus-export.mts. Contacts and
// notes keep the Manus prospect id (pid); the server swaps it for our uuid.

export type ManusExport = {
  manifest?: { counts?: Record<string, number> };
  prospects: Record<string, unknown>[];
  contacts?: Record<string, Record<string, unknown>[]>;
  notes?: Record<string, Record<string, unknown>[]>;
  sequences?: unknown[];
};

const MANUS_ANGLE: Record<string, string> = {
  "AI-Generated Website": "Website Lead",
  "AI Visibility": "AI Visibility Lead",
  "AI Infrastructure": "AI Infrastructure Lead",
};

export function transformManusExport(exp: ManusExport) {
  const str = (v: unknown): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const num = (v: unknown, d = 0): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const date = (v: unknown): string | null => {
    if (!v) return null;
    const t = new Date(String(v));
    return Number.isNaN(t.getTime()) ? null : t.toISOString();
  };
  const now = new Date().toISOString();
  const problems: string[] = [];
  if (!Array.isArray(exp?.prospects)) return { prospects: [], contacts: [], notes: [], problems: ["This file has no prospects list. Is it the Manus export?"], stats: {} as Record<string, number> };

  const prospects = exp.prospects.map((p) => {
    const status = str(p.contactStatus) ?? "Never contacted";
    if (!(STATUSES as readonly string[]).includes(status)) problems.push(`Manus #${p.id}: unknown status "${status}"`);
    const stage = str(p.dealStage) ?? "New Lead";
    if (!(DEAL_STAGES as readonly string[]).includes(stage)) problems.push(`Manus #${p.id}: unknown deal stage "${stage}"`);
    const tags = Array.isArray(p.tags) ? (p.tags as unknown[]).map(String) : [];
    const importTag = tags.find((t) => t.startsWith("Imported: "));
    if (!str(p.companyName)) problems.push(`Manus #${p.id}: no company name`);
    return {
      legacy_id: num(p.id),
      company: str(p.companyName) ?? "Unknown",
      contact_name: str(p.contactName),
      contact_title: str(p.contactTitle),
      email: str(p.email),
      phone: str(p.phone),
      city: str(p.city),
      state: str(p.state),
      zip: str(p.zipCode),
      website: str(p.website),
      website_domain: companyDomain(str(p.website), str(p.email)),
      linkedin: str(p.linkedinUrl),
      category: str(p.category),
      service_angle: MANUS_ANGLE[String(p.primaryService)] ?? null,
      primary_service: str(p.primaryService),
      primary_sub_service: str(p.primarySubService),
      addon_services: Array.isArray(p.addonServices) ? (p.addonServices as unknown[]).map(String) : [],
      status,
      tags,
      lead_score: num(p.leadScore),
      priority_call_rank: p.priorityCallRank == null ? null : num(p.priorityCallRank),
      estimated_revenue: str(p.estimatedRevenue),
      company_size: str(p.companySize),
      source: importTag ? `Manus: ${importTag.slice("Imported: ".length)}` : "Manus CRM",
      notes: str(p.notes),
      deal_stage: stage,
      deal_value: num(p.dealValue),
      follow_up_count: num(p.followUpCount),
      last_contact_at: date(p.lastContactDate),
      created_at: date(p.createdAt) ?? now,
      updated_at: date(p.updatedAt) ?? now,
    };
  });

  const contacts = Object.entries(exp.contacts ?? {}).flatMap(([pid, list]) => list.map((c) => ({
    pid: Number(pid),
    legacy_id: num(c.id),
    name: str(c.name),
    title: str(c.title),
    email: str(c.email),
    phone: str(c.phone),
    linkedin: str(c.linkedinUrl),
    source_urls: Array.isArray(c.sourceUrls) ? (c.sourceUrls as unknown[]).map(String) : c.sourceUrls ? [String(c.sourceUrls)] : [],
    confidence: str(c.confidence),
    is_primary: !!c.isPrimary,
    created_at: date(c.createdAt) ?? now,
    updated_at: date(c.updatedAt) ?? now,
  })));
  const notes = Object.entries(exp.notes ?? {}).flatMap(([pid, list]) => list.map((n) => ({
    pid: Number(pid),
    legacy_id: num(n.id),
    type: str(n.type) ?? "note",
    content: str(n.content) ?? "",
    scheduled_at: date(n.scheduledAt),
    completed_at: date(n.completedAt),
    created_at: date(n.createdAt) ?? now,
  })));

  const ids = new Set(prospects.map((p) => p.legacy_id));
  if (ids.size !== prospects.length) problems.push(`${prospects.length - ids.size} repeated Manus ids in the export`);
  for (const r of [...contacts, ...notes]) if (!ids.has(r.pid)) problems.push(`Contact or note points at missing Manus #${r.pid}`);
  const m = exp.manifest?.counts;
  const check = (name: string, got: number, want?: number) => { if (want != null && want !== got) problems.push(`${name}: export manifest says ${want}, file has ${got}`); };
  if (m) {
    check("prospects", prospects.length, m.prospects);
    check("contacts", contacts.length, m.contacts);
    check("notes", notes.length, m.notes);
    check("sequences", exp.sequences?.length ?? 0, m.sequences);
  }
  const count = (pred: (p: (typeof prospects)[number]) => boolean) => prospects.filter(pred).length;
  const stats = {
    prospects: prospects.length,
    contacts: contacts.length,
    notes: notes.length,
    sequences: exp.sequences?.length ?? 0,
    doNotContact: count((p) => p.status === "Do Not Contact"),
    withEmail: count((p) => !!p.email),
    withPhone: count((p) => !!p.phone),
  };
  return { prospects, contacts, notes, problems, stats };
}
