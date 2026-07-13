// Client-facing report engine. The FIRST report for a business is its
// "Baseline" (where you stand at day zero); every later one is a monthly
// edition with deltas. Built from real tracking + task data only; Claude
// writes the plain-English narrative. Stored in client_reports, rendered in
// the dashboard, on the public share page, and printable to PDF.

import { getBusiness, getProbeResults, listTrackedPrompts, listTasks, saveClientReport, listClientReports, briefingRoster, getLatestMapsGrid, getLatestTownScan } from "./db";
import { citationIntel } from "./citations";
import { ENGINES } from "./engines";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "./email";

export interface ClientReportPayload {
  business: { name: string; trade: string; city: string };
  period_label: string;
  is_baseline: boolean;
  generated_at: string;
  metrics: {
    mention_rate: number | null;
    mention_rate_prev: number | null;
    share_of_voice: number | null;
    engines: Record<string, { rate: number | null; prev: number | null }>;
    top_competitors: { name: string; count: number }[];
    prompts_tracked: number;
    tasks_done: number;
    tasks_total: number;
  };
  wins: string[];
  narrative: { headline: string; summary: string; what_this_means: string; focus_next: string[]; client_actions: string[] };
  maps_grid?: {
    keyword: string; grid_size: number; spacing_miles: number; scanned_at: string;
    points: { rank: number | null }[];
    stats: { present: number; top3: number; top10: number; total: number; avg_rank: number | null; coverage: number };
  } | null;
  ai_towns?: { town: string; score: number }[] | null;
  top_citations?: { domain: string; count: number; owned: boolean }[] | null;
}

export async function buildClientReport(businessId: string): Promise<{ id: string | null; payload: ClientReportPayload } | null> {
  const business = await getBusiness(businessId);
  if (!business) return null;

  const [results, prompts, tasks, existing, gridScan, townScan, citations] = await Promise.all([
    getProbeResults(businessId, 62),
    listTrackedPrompts(businessId),
    listTasks(businessId),
    listClientReports(businessId),
    getLatestMapsGrid(businessId),
    getLatestTownScan(businessId),
    citationIntel(businessId).catch(() => null),
  ]);
  const isBaseline = existing.length === 0;

  const now = Date.now();
  const days31 = 31 * 86400000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inWin = (r: any, from: number, to: number) => { const t = new Date(String(r.run_at)).getTime(); return t >= from && t < to; };
  const cur = results.filter((r) => inWin(r, now - days31, now + 1));
  const prev = results.filter((r) => inWin(r, now - 2 * days31, now - days31));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rate = (rows: any[]) => (rows.length ? Math.round((100 * rows.filter((r) => r.mentioned).length) / rows.length) : null);

  const engines: Record<string, { rate: number | null; prev: number | null }> = {};
  for (const e of ENGINES) {
    engines[e] = { rate: rate(cur.filter((r) => r.engine === e)), prev: rate(prev.filter((r) => r.engine === e)) };
  }

  // Share of voice + competitors from the latest verdict per prompt|engine.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latest: Record<string, any> = {};
  for (const r of cur) latest[`${r.prompt_id}|${r.engine}`] = r;
  const latestRows = Object.values(latest);
  let mentions = 0;
  const compCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of latestRows as any[]) {
    if (r.mentioned) mentions++;
    if (Array.isArray(r.competitors)) for (const c of r.competitors) { const k = String(c).trim(); if (k) compCounts[k] = (compCounts[k] || 0) + 1; }
  }
  const compTotal = Object.values(compCounts).reduce((a, b) => a + b, 0);
  const sov = mentions + compTotal > 0 ? Math.round((100 * mentions) / (mentions + compTotal)) : null;
  const topCompetitors = Object.entries(compCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  // Wins: prompt×engine flips ✗→✓ vs the previous window.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevLatest: Record<string, any> = {};
  for (const r of prev) prevLatest[`${r.prompt_id}|${r.engine}`] = r;
  const promptText = Object.fromEntries(prompts.map((p) => [p.id, p.prompt]));
  const wins: string[] = [];
  for (const k of Object.keys(latest)) {
    const [pid, engine] = k.split("|");
    if (latest[k].mentioned && prevLatest[k] && !prevLatest[k].mentioned) {
      wins.push(`Now named in ${engine} for "${(promptText[pid] ?? "").slice(0, 80)}"`);
    }
  }

  const done = tasks.filter((t) => t.status === "done");
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const periodLabel = isBaseline ? `Baseline — ${monthName}` : monthName;

  const metrics: ClientReportPayload["metrics"] = {
    mention_rate: rate(cur), mention_rate_prev: rate(prev), share_of_voice: sov,
    engines, top_competitors: topCompetitors, prompts_tracked: prompts.length,
    tasks_done: done.length, tasks_total: tasks.length,
  };

  // Claude writes the client-facing narrative — grounded, warm, no hype.
  let narrative: ClientReportPayload["narrative"] = {
    headline: isBaseline ? `Where ${business.name} stands today` : `${business.name} — ${monthName} progress`,
    summary: "", what_this_means: "", focus_next: [], client_actions: [],
  };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const clientTasks = tasks.filter((t) => t.status !== "done" && t.owner === "Client").map((t) => t.task).slice(0, 5);
      const openOurs = tasks.filter((t) => t.status !== "done" && t.owner !== "Client").map((t) => t.task).slice(0, 6);
      const facts = { business: business.name, trade: business.trade, city: business.city, is_baseline: isBaseline, metrics, wins: wins.slice(0, 6), our_open_work: openOurs, client_actions_open: clientTasks };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1200, temperature: 0,
          system: `You write a client-facing AI-visibility report for a contractor client of 6 Signal. Plain English, warm, zero jargon, zero hype, grounded ONLY in the facts given. Explain numbers simply (mention rate = "when people ask AI assistants for a ${business.trade.toLowerCase()} in your area, you come up X% of the time"). If is_baseline, frame it as the starting line being measured before the work shows results. Return ONLY JSON: {"headline":"one strong plain sentence","summary":"3-4 sentences on where things stand","what_this_means":"2-3 sentences on what this means for their business in real terms (calls, jobs)","focus_next":["2-4 short bullets: what 6 Signal is doing next"],"client_actions":["0-3 short bullets: what the client should do, from client_actions_open only"]}`,
          messages: [{ role: "user", content: JSON.stringify(facts) }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
        const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          narrative = {
            headline: parsed.headline || narrative.headline,
            summary: parsed.summary || "",
            what_this_means: parsed.what_this_means || "",
            focus_next: Array.isArray(parsed.focus_next) ? parsed.focus_next.map(String).slice(0, 4) : [],
            client_actions: Array.isArray(parsed.client_actions) ? parsed.client_actions.map(String).slice(0, 3) : [],
          };
        }
      }
    } catch (e) {
      console.error("[clientReport] narrative failed:", e);
    }
  }

  const payload: ClientReportPayload = {
    business: { name: business.name, trade: business.trade, city: business.city },
    period_label: periodLabel, is_baseline: isBaseline,
    generated_at: new Date().toISOString(),
    metrics, wins: wins.slice(0, 8), narrative,
    maps_grid: gridScan ? {
      keyword: String(gridScan.keyword),
      grid_size: Number(gridScan.grid_size),
      spacing_miles: Number(gridScan.spacing_miles),
      scanned_at: String(gridScan.created_at),
      points: (gridScan.points as { rank: number | null }[]).map((p) => ({ rank: p.rank })),
      stats: gridScan.stats as { present: number; top3: number; top10: number; total: number; avg_rank: number | null; coverage: number },
    } : null,
    ai_towns: townScan
      ? (townScan.towns as { town: string; score: number }[]).map((t) => ({ town: t.town, score: t.score }))
      : null,
    top_citations: citations?.rows.length
      ? citations.rows.slice(0, 8).map((r) => ({ domain: r.domain, count: r.count, owned: r.owned }))
      : null,
  };
  const id = await saveClientReport(businessId, periodLabel, payload);
  return { id, payload };
}

// Monthly sweep (runs in the background worker): generate a report for every
// tracked business and email the OWNER a copy — Matt reviews/forwards; nothing
// goes to a client unsent by him.
export async function runMonthlyClientReports(): Promise<{ generated: number }> {
  const roster = await briefingRoster();
  let generated = 0;
  for (const b of roster) {
    try {
      const rep = await buildClientReport(b.id);
      if (!rep) continue;
      generated++;
      const m = rep.payload.metrics;
      const n = rep.payload.narrative;
      await sendEmail({
        to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
        subject: `📄 Client report ready — ${b.name} (${rep.payload.period_label})`,
        html: emailShell([
          monoLabel(`${b.name} · ${rep.payload.period_label}`),
          heading(n.headline),
          paragraph(n.summary),
          paragraph(`Mention rate: <strong style="color:#f5f5f3;">${m.mention_rate ?? "—"}%</strong>${m.mention_rate_prev != null && m.mention_rate != null ? ` (was ${m.mention_rate_prev}%)` : ""} · Share of voice: <strong style="color:#f5f5f3;">${m.share_of_voice ?? "—"}%</strong> · Tasks: ${m.tasks_done}/${m.tasks_total}`),
          paragraph(`Open the client's file in the dashboard to review, download the PDF, or send it: <a href="https://6signal.co/dashboard" style="color:#E6FF00;">6signal.co/dashboard</a>`),
        ].join("")),
      });
    } catch (e) {
      console.error("[clientReport] monthly failed for", b.name, e);
    }
  }
  return { generated };
}
