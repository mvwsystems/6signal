// ── Inquiry spam filter ──────────────────────────────────────────────────────
// The recurring junk is keyboard-mash: "Isrvbg Iurxqtm — Qysns LLC", message
// "Fcyhta", a dotted throwaway Gmail. Those bots post only the visible fields,
// so the honeypot never fires; score the words instead.
//
// A word is mash when it contains a letter pair that does not occur in real
// words or names (English, Spanish, German, Slavic, Vietnamese surnames all
// checked against the list), or a run of five or more consonants. Vowel-ratio
// rules were tried and rejected: they drop Schmidt and Schwartz and still
// miss "Fcyhta".
const IMPOSSIBLE_PAIRS = new Set([
  "bq", "bx", "cx", "dx", "fc", "fq", "fx", "gq", "gx", "hx", "jb", "jc", "jd", "jf", "jg", "jh", "jk", "jl",
  "jm", "jn", "jp", "jq", "jr", "js", "jt", "jv", "jw", "jx", "jz", "kq", "kx", "mx", "px", "qb", "qc", "qd",
  "qf", "qg", "qh", "qj", "qk", "ql", "qm", "qn", "qp", "qr", "qs", "qt", "qv", "qw", "qx", "qy", "qz", "sx",
  "vb", "vc", "vf", "vg", "vh", "vj", "vp", "vq", "vw", "vx", "vz", "wq", "wx", "xj", "xq", "xz", "yq", "zj",
  "zq", "zx",
]);
const CONSONANT_RUN = /[bcdfghjklmnpqrstvwxz]{5,}/;

export function isGibberishWord(word: string): boolean {
  const letters = word.replace(/[^a-z]/gi, "").toLowerCase();
  if (letters.length < 5) return false; // TX, LLC, HVAC, DFW
  if (CONSONANT_RUN.test(letters)) return true;
  for (let i = 0; i < letters.length - 1; i++) {
    if (IMPOSSIBLE_PAIRS.has(letters.slice(i, i + 2))) return true;
  }
  return false;
}

function score(text: string): { words: number; bad: number } {
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  return { words: words.length, bad: words.filter(isGibberishWord).length };
}

// Returns the reason a submission looks generated, or null for a human.
export function looksLikeSpam(f: { name?: string; company?: string; email?: string; message?: string }): string | null {
  const name = f.name ?? "";
  const body = (f.message ?? "").replace(/^Trade:.*$/m, ""); // /contact prepends its trade select
  if (score(name).bad > 0) return `gibberish name "${name}"`;
  const rest = score([f.company ?? "", body].join(" "));
  // Two mash words is a bot; one alone could be a brand or a typo.
  if (rest.bad >= 2 || (rest.words > 0 && rest.bad === rest.words)) {
    return `gibberish text (${rest.bad}/${rest.words} words)`;
  }
  // Gmail ignores dots in the local part, so "ntlpfyc.bj.g.g.69" is a
  // generated alias. Real addresses top out around two dots.
  const local = (f.email ?? "").split("@")[0] ?? "";
  if ((local.match(/\./g) ?? []).length >= 4) return `dotted throwaway email "${f.email}"`;
  return null;
}
