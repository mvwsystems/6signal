// The Contractor Profit Leak Audit — the twenty-one scored questions from
// Field Guide No. 01 (pages 13–14), the seven leaks they belong to, and the
// score bands. Shared by the /profit-leak page and its API route so the two
// can never disagree about what a question is or what a score means.

export interface AuditSection {
  num: string;
  leak: string; // short name, as printed in the guide
  livesIn: string; // the department seam the leak hides in
  questions: [string, string, string];
}

export const SECTIONS: AuditSection[] = [
  {
    num: "01",
    leak: "Phantom Profit",
    livesIn: "Accounting method",
    questions: [
      "We allocate overhead using at least two drivers, not revenue alone.",
      "I can name our least profitable job type — not job — and defend it with numbers.",
      "We track project management hours by job and review revenue per PM hour.",
    ],
  },
  {
    num: "02",
    leak: "The Cost of Losing",
    livesIn: "Preconstruction",
    questions: [
      "We know our hit rate broken out by source, not just company-wide.",
      "We have a written go / no-go standard that has caused us to decline a bid in the last ninety days.",
      "I know roughly what one pursuit costs us in estimating time.",
    ],
  },
  {
    num: "03",
    leak: "Money You Already Earned",
    livesIn: "Working capital",
    questions: [
      "I know our total retainage receivable right now, within ten percent.",
      "We track average days-held by owner and use it in go / no-go.",
      "We have requested reduced retention or billed retainage early in the last twelve months.",
    ],
  },
  {
    num: "04",
    leak: "Iron That Isn't Working",
    livesIn: "The field",
    questions: [
      "Someone reconciles open rental lines against the look-ahead schedule at least weekly.",
      "Every call-off is confirmed in writing with a confirmation number on file.",
      "Off-rent dates are set from the schedule in advance, not decided in the moment.",
    ],
  },
  {
    num: "05",
    leak: "Somebody Else's Payroll",
    livesIn: "Risk / insurance",
    questions: [
      "We track subcontractor certificates by expiration date, not by contract.",
      "Renewal certificates are requested automatically before the policy lapses.",
      "Our last insurance audit produced no material additional premium for uncovered subs.",
    ],
  },
  {
    num: "06",
    leak: "The Burden You Guessed",
    livesIn: "Estimating",
    questions: [
      "Our labor burden rate was recalculated from actual payroll data in the last twelve months.",
      "Burden is divided by billable hours, not total payroll hours.",
      "Actual productivity from completed jobs feeds back into our estimating database.",
    ],
  },
  {
    num: "07",
    leak: "The Claim You Forfeited",
    livesIn: "Project controls",
    questions: [
      "Every active job over our threshold has a baseline schedule and current monthly updates.",
      "We give written notice of delay within the contract window every time, as policy.",
      "Daily reports record the cause of lost time, not just weather and headcount.",
    ],
  },
];

export const QUESTION_COUNT = SECTIONS.length * 3; // 21

export interface Band {
  min: number;
  max: number;
  label: string;
  text: string;
}

// Verbatim from the guide's "What it means" panel.
export const BANDS: Band[] = [
  {
    min: 17,
    max: 21,
    label: "Genuinely well controlled",
    text: "Your leaks are in the appendix items and in mix strategy. Go read page 12.",
  },
  {
    min: 11,
    max: 16,
    label: "Normal for a well-run shop",
    text: "Two or three leaks are running unmeasured. Pick your two lowest sections and fix those only.",
  },
  {
    min: 6,
    max: 10,
    label: "Your margin is being set by things nobody is watching",
    text: "The modeled exposure on page 4 is likely conservative for you.",
  },
  {
    min: 0,
    max: 5,
    label: "Everything is running on the owner's memory",
    text: "That works until volume outgrows one person's attention — and it already has.",
  },
];

export function bandFor(score: number): Band {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[BANDS.length - 1];
}

// Score is simply the count of unqualified yeses. Section scores are 0–3.
export function scoreAnswers(answers: boolean[]): { total: number; sections: number[] } {
  const sections = SECTIONS.map((_, i) =>
    answers.slice(i * 3, i * 3 + 3).filter(Boolean).length
  );
  return { total: sections.reduce((a, b) => a + b, 0), sections };
}

export const PDF_PATH = "/6signal-contractor-profit-leak-audit.pdf";
export const PDF_URL = `https://6signal.co${PDF_PATH}`;
