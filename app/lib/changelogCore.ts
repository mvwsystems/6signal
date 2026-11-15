// Shared by the Changelog API, the GitHub logger and the history backfill.
// Pure functions only (no database), so they can run anywhere.

// Starter lists for the Changelog filters and the "Add entry" form. Anything
// already used in the log also shows up, so a new client appears by using it.
export const CLIENTS = [
  "6 Signal", "X-Act Plumbing", "Hill & Wilkinson", "SR Equipment", "OEM Contracting", "NTX Boatworks",
];
export const SERVICES = [
  "Command Center", "CRM", "Website", "Visibility (SEO / AEO / GEO)", "Google Business Profile", "Ads",
  "AI infrastructure", "Content", "Newsletter", "Sales & proposals",
];

// Which client a GitHub repository's work is for. Unlisted repos log with no
// client until one is set here.
export const REPO_CLIENTS: Record<string, string> = {
  "mvwsystems/6signal": "6 Signal",
  "mvwsystems/6signal-crm": "6 Signal",
  "mvwsystems/x-act-plumbing": "X-Act Plumbing",
  "mvwsystems/xact-plumbing": "X-Act Plumbing",
  "mvwsystems/sr-equipment-site": "SR Equipment",
  "mvwsystems/oem-contracting": "OEM Contracting",
  "mvwsystems/NTX-Boatworks": "NTX Boatworks",
};

// For the 6 Signal site repo: which part of 6 Signal a change touched, judged
// by the files it changed (the bucket with the most files wins).
const BUCKETS: [string, RegExp][] = [
  ["CRM", /(^|\/)(CrmTab|crm(Core)?\.ts|crm\/|.*_crm_|load-manus)/i],
  ["Newsletter", /newsletter/i],
  ["Sales & proposals", /proposal/i],
  ["Command Center", /^app\/(dashboard|api\/dashboard)\/|^app\/lib\/(commandCenter|dashboard-auth|session|actor|alerts|googleAuth|changelog)|^supabase\/migrations\//],
  ["Content", /^content\//],
];

export function serviceFromPaths(paths: string[], repo = "mvwsystems/6signal"): string | null {
  if (repo !== "mvwsystems/6signal") return paths.length ? "Website" : null;
  if (!paths.length) return "Website";
  const score = new Map<string, number>();
  for (const p of paths) {
    const hit = BUCKETS.find(([, re]) => re.test(p));
    const k = hit ? hit[0] : "Website";
    score.set(k, (score.get(k) ?? 0) + 1);
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// "Merge pull request #10 from owner/branch" + body line → "#10: <title>"
export function summaryFromCommit(message: string): { summary: string; pr: number | null } {
  const [first, ...rest] = message.split("\n");
  const m = first.match(/^Merge pull request #(\d+) from /);
  if (m) {
    const title = rest.map((l) => l.trim()).find(Boolean);
    return { summary: `Merged pull request #${m[1]}${title ? `: ${title}` : ""}`, pr: Number(m[1]) };
  }
  const sq = first.match(/\(#(\d+)\)\s*$/);
  return { summary: first.trim(), pr: sq ? Number(sq[1]) : null };
}

// Housekeeping merges (syncing a branch with main) aren't work to log.
export const isSyncMerge = (message: string) => /^Merge (branch|remote-tracking branch) /.test(message.trim());
