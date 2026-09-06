// Inquiry spam screen. Layered heuristics, no third-party captcha — the site
// has no room for a Turnstile widget in the design system and the bots hitting
// /contact are the generic form-fillers that type keyboard-mash into every
// field ("Yejg Nbxsrlzjd — Cuoncslb LLC", message "Ujzyouslx"). Each signal
// adds to a score; the route drops anything at or above SPAM_THRESHOLD and
// still answers { ok: true } so the bot never learns it was filtered.

export const SPAM_THRESHOLD = 3;

export interface InquirySignals {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  message?: string | null;
  hp?: string | null;
  /** Milliseconds between the form rendering and the submit (client-reported). */
  elapsedMs?: number | null;
}

export interface SpamVerdict {
  spam: boolean;
  score: number;
  reasons: string[];
}

const RARE = new Set(["j", "q", "x", "z", "v", "k", "w"]);

/**
 * True when a single word reads as keyboard-mash rather than a name or a
 * real word. Deliberately loose on real-world edge cases (Polish/Welsh
 * surnames, acronyms) — a hit here is one signal, never the verdict.
 */
export function looksGibberish(raw: string): boolean {
  const word = raw.replace(/[^A-Za-z]/g, "");
  if (word.length < 5) return false;
  // Acronyms and stock tickers are legitimately vowel-free.
  if (word === word.toUpperCase()) return false;
  const w = word.toLowerCase();

  // No vowels at all, or one vowel carrying nine-plus letters. A ratio test
  // would catch "Schmidt" and "Schwartz"; an absolute count does not.
  const vowels = (w.match(/[aeiouy]/g) ?? []).length;
  if (vowels === 0 || (vowels === 1 && w.length >= 9)) return true;

  let run = 0;
  for (const ch of w) {
    run = /[aeiouy]/.test(ch) ? 0 : run + 1;
    if (run >= 5) return true;
  }

  if (w.length <= 10) {
    const rare = new Set([...w].filter((ch) => RARE.has(ch)));
    if (rare.size >= 3) return true;
  }
  return false;
}

const words = (s: string) => s.split(/[\s,./\-–—]+/).filter(Boolean);

function gibberishCount(s: string): { hits: number; total: number } {
  const ws = words(s);
  return { hits: ws.filter(looksGibberish).length, total: ws.length };
}

export function scoreInquiry(input: InquirySignals): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;
  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (input.hp?.trim()) add(SPAM_THRESHOLD, "honeypot");

  const name = (input.name ?? "").trim();
  if (name && gibberishCount(name).hits > 0) add(2, "name_gibberish");

  // "LLC", "Inc" etc. are stripped by the acronym rule; score what's left.
  const company = (input.company ?? "").trim();
  if (company && gibberishCount(company).hits > 0) add(1, "company_gibberish");

  // /contact prefixes the message with "Trade: <select value>" — not user text.
  const message = (input.message ?? "")
    .split("\n")
    .filter((line) => !/^\s*trade:/i.test(line))
    .join("\n")
    .trim();
  if (message) {
    const { hits, total } = gibberishCount(message);
    if (total <= 3 && hits > 0) add(2, "message_gibberish");
    else if (total > 3 && hits / total >= 0.4) add(2, "message_gibberish");
    const links = (message.match(/https?:\/\//gi) ?? []).length;
    if (links >= 2) add(1, "message_links");
  }

  const email = (input.email ?? "").trim().toLowerCase();
  const at = email.indexOf("@");
  if (at > 0) {
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    // Gmail ignores dots, so spammers mint "a.b.c.d.name37@gmail.com" variants
    // of one inbox to dodge per-address blocks. Humans rarely type three.
    const dots = (local.match(/\./g) ?? []).length;
    if (/^(gmail|googlemail)\.com$/.test(domain) && dots >= 3) add(1, "dotted_gmail");
    if (looksGibberish(local.replace(/\d+$/, ""))) add(1, "email_gibberish");
  }

  const elapsed = input.elapsedMs;
  if (typeof elapsed === "number" && Number.isFinite(elapsed) && elapsed >= 0) {
    if (elapsed < 800) add(2, "instant_submit");
    else if (elapsed < 3000) add(1, "fast_submit");
  }

  return { spam: score >= SPAM_THRESHOLD, score, reasons };
}

// ---------------------------------------------------------------------------
// Per-IP throttle. In-memory, so on Netlify it only holds within one warm
// function instance — enough to blunt a burst from one bot, not a guarantee.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Records one submission from `ip` and reports whether it exceeded the window. */
export function throttled(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}
