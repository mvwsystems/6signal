// First-touch attribution. Analytics tells us how much traffic arrived and
// where from; this records where the person who actually converted came from,
// so a $27 sale can be traced back to ChatGPT, an ad, or a search.
//
// First touch, not last: the visit that discovered us is the one that earned
// the lead, and it is never overwritten by a later direct return visit.

export interface Attribution {
  channel: string;      // ai | search | social | paid | referral | email | direct
  source: string;       // chatgpt.com, google, facebook, (direct) …
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  landing: string;      // first path seen
  at: string;           // ISO timestamp of first touch
}

const KEY = "6sig_attrib";

// Assistants that send buyers here. The whole practice is built on being named
// inside these, so they get their own channel rather than melting into
// "referral" the way every off-the-shelf analytics tool reports them.
const AI_HOSTS = [
  "chatgpt.com", "chat.openai.com", "openai.com", "perplexity.ai",
  "gemini.google.com", "bard.google.com", "claude.ai", "copilot.microsoft.com",
  "you.com", "poe.com", "phind.com", "grok.com", "meta.ai", "duck.ai",
];
const SEARCH_HOSTS = ["google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.", "brave.", "search."];
const SOCIAL_HOSTS = [
  "facebook.com", "instagram.com", "linkedin.com", "lnkd.in", "t.co", "x.com",
  "twitter.com", "youtube.com", "reddit.com", "tiktok.com", "nextdoor.com",
];

const hostOf = (url: string): string => {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

function classify(host: string, params: URLSearchParams): { channel: string; source: string } {
  const utmSource = params.get("utm_source");
  const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();

  // Ad clicks identify themselves whatever the referrer says.
  if (params.get("gclid") || params.get("fbclid") || /cpc|ppc|paid|ads?/.test(utmMedium)) {
    return { channel: "paid", source: utmSource || (params.get("fbclid") ? "facebook" : "google") };
  }
  if (/email|newsletter/.test(utmMedium)) return { channel: "email", source: utmSource || "email" };
  if (utmSource && AI_HOSTS.some((h) => utmSource.toLowerCase().includes(h.split(".")[0]))) {
    return { channel: "ai", source: utmSource };
  }

  if (host) {
    if (AI_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return { channel: "ai", source: host };
    if (SEARCH_HOSTS.some((h) => host.startsWith(h) || host.includes(`.${h}`))) return { channel: "search", source: host };
    if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return { channel: "social", source: host };
    return { channel: "referral", source: host };
  }

  if (utmSource) return { channel: utmMedium || "referral", source: utmSource };
  // No referrer and no tag. Several assistants strip the referrer, so a share
  // of this bucket is really AI traffic — tag published links to separate it.
  return { channel: "direct", source: "(direct)" };
}

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(KEY)) return; // first touch already recorded
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer || "";
    const host = hostOf(ref);
    // Same-site navigation isn't an arrival.
    if (host && host === window.location.hostname.replace(/^www\./, "")) return;
    const { channel, source } = classify(host, params);
    const record: Attribution = {
      channel,
      source,
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
      referrer: ref || null,
      landing: window.location.pathname,
      at: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch { /* private mode — attribution is best-effort, never blocks a lead */ }
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch { return null; }
}
