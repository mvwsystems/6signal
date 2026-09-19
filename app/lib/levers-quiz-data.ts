// The ten-question levers audit embedded in the MIT post. One question per
// lever, phrased for a contractor. Shared by the client component and the API
// route so a score means the same thing in the browser, in the email, and in
// the owner alert. Bands are ours, keyed to the report's failure modes.

export interface LeverQuestion {
  num: string;
  lever: string;
  question: string;
}

export const LEVER_QUESTIONS: LeverQuestion[] = [
  { num: "01", lever: "Gather evidence", question: "Before we rolled out any AI tool, we wrote down the problem it was supposed to fix and how we would know it worked." },
  { num: "02", lever: "One size does not fit all", question: "Our people are allowed to use AI tools differently — nobody is forced onto one script." },
  { num: "03", lever: "Learn when to trust", question: "Everyone here who uses AI can name a task where they check its output and a task where they don't bother." },
  { num: "04", lever: "Minimize drudgery", question: "AI is taking routine work off our plate — proposals, follow-ups, scheduling — not the parts people are actually good at." },
  { num: "05", lever: "Promote learning", question: "New hires who use AI are still learning the trade, not just producing passable work they can't explain." },
  { num: "06", lever: "Preserve teamwork", question: "AI hasn't replaced the conversations where the crew learns from each other." },
  { num: "07", lever: "Design better interfaces", question: "We've adjusted how our AI tools are set up for our business rather than using them out of the box." },
  { num: "08", lever: "Invest in expertise", question: "Our most experienced people review what AI produces on anything that matters." },
  { num: "09", lever: "Maintain accountability", question: "When AI gets something wrong, a named person owns the fix." },
  { num: "10", lever: "Create new work", question: "AI has created at least one new responsibility here, not just removed old ones." },
];

export const LEVER_COUNT = LEVER_QUESTIONS.length;

export interface LeverBand {
  min: number;
  max: number;
  label: string;
  text: string;
}

export const LEVER_BANDS: LeverBand[] = [
  { min: 9, max: 10, label: "Deliberate", text: "You are doing what the companies that scaled did: a defined problem, calibrated trust, an expert in the loop, a name on the output. Your remaining lever is the one to protect, not the one to chase." },
  { min: 6, max: 8, label: "Ahead of most", text: "Two or three levers unpulled — in most shops it is trust calibration and accountability. Those two are practices, not purchases, and they close in a week." },
  { min: 3, max: 5, label: "Faster, not better", text: "The tools are saving time and nobody has asked what they did to quality, rework, or the skills of the person who used to do the task. This is the report's Stage 1. Pick one problem and get evidence before scaling anything else." },
  { min: 0, max: 2, label: "Try everything", text: "Tools in use, no problem defined. That is the zone the report calls disuse or misuse, and it is where most shops start. The first lever is the only one that matters right now: write down what one tool is for and how you would know it worked." },
];

export function leverBandFor(score: number): LeverBand {
  return LEVER_BANDS.find((b) => score >= b.min && score <= b.max) ?? LEVER_BANDS[LEVER_BANDS.length - 1];
}

export function scoreLevers(answers: boolean[]): { total: number; lowest: LeverQuestion[] } {
  const total = answers.filter(Boolean).length;
  // The levers left unchecked, in report order — the reader's starting list.
  const lowest = LEVER_QUESTIONS.filter((_, i) => !answers[i]).slice(0, 3);
  return { total, lowest };
}
