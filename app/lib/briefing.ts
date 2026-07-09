// Owner briefing — runs inside the BACKGROUND worker (per-client queries + a
// Claude call can exceed the scheduled trigger's window, which made Netlify
// retry and duplicate emails).

import { briefingRoster, getProbeResults, listTrackedPrompts, listTasks } from "./db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "./email";

const ALERT_TO = () => process.env.LEAD_ALERT_TO || "hello@6signal.co";

interface ClientNarrative { name: string; status: string; say_to_client: string; wins: string[]; risks: string[] }

export async function runOwnerBriefing(): Promise<{ clients: number; emailed: boolean }> {
  const roster = await briefingRoster();
  if (!roster.length) return { clients: 0, emailed: false };

  // Two-week windows to match the biweekly probe cadence.
  const clients = await Promise.all(
    roster.map(async (b) => {
      const [results, prompts, tasks] = await Promise.all([
        getProbeResults(b.id, 35),
        listTrackedPrompts(b.id),
        listTasks(b.id),
      ]);
      const promptText = Object.fromEntries(prompts.map((p) => [p.id, p.prompt]));
      const winMs = 14 * 86400000;
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inWindow = (r: any, from: number, to: number) => { const t = new Date(String(r.run_at)).getTime(); return t >= from && t < to; };
      const thisWin = results.filter((r) => inWindow(r, now - winMs, now + 1));
      const lastWin = results.filter((r) => inWindow(r, now - 2 * winMs, now - winMs));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rate = (rows: any[]) => (rows.length ? Math.round((100 * rows.filter((r) => r.mentioned).length) / rows.length) : null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const latestBy = (rows: any[]) => { const m: Record<string, any> = {}; for (const r of rows) m[`${r.prompt_id}|${r.engine}`] = r; return m; };
      const cur = latestBy(thisWin), prev = latestBy(lastWin);
      const flips: string[] = [];
      for (const k of Object.keys(cur)) {
        if (!(k in prev)) continue;
        if (cur[k].mentioned !== prev[k].mentioned) {
          const [pid, engine] = k.split("|");
          flips.push(`${cur[k].mentioned ? "GAINED" : "LOST"} ${engine} on "${(promptText[pid] ?? "?").slice(0, 70)}"`);
        }
      }
      const openTasks = tasks.filter((t) => t.status !== "done");
      return {
        ...b,
        rateThisWeek: rate(thisWin),
        rateLastWeek: rate(lastWin),
        flips: flips.slice(0, 6),
        probesThisWeek: thisWin.length,
        tasks6Signal: openTasks.filter((t) => t.owner !== "Client").slice(0, 6),
        tasksClient: openTasks.filter((t) => t.owner === "Client").slice(0, 4),
        tasksDone: tasks.filter((t) => t.status === "done").length,
        tasksTotal: tasks.length,
      };
    })
  );

  let narratives: Record<string, ClientNarrative> = {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const facts = clients.map((c) => ({
      name: c.name, trade: c.trade, city: c.city,
      mention_rate_this_period: c.rateThisWeek, mention_rate_last_period: c.rateLastWeek,
      changes: c.flips, probes_this_period: c.probesThisWeek,
      tasks_done: c.tasksDone, tasks_total: c.tasksTotal,
    }));
    const system = `You write Matt Vincent Walker's briefing for his AI-visibility practice (6 Signal). For EACH client given, write: "status" (2 plain sentences on trajectory — honest, specific, no fluff), "say_to_client" (the exact 1-2 sentences Matt should say to that client this period — concrete, confident, references real numbers), "wins" (0-3 short bullets), "risks" (0-2 short bullets). Ground everything ONLY in the facts given; if there is no probe data yet, say the baseline is being established. Return ONLY JSON: { "clients": [ { "name": "", "status": "", "say_to_client": "", "wins": [], "risks": [] } ] }`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2048, temperature: 0, system, messages: [{ role: "user", content: JSON.stringify(facts) }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
        const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          for (const c of parsed.clients ?? []) narratives[String(c.name)] = c as ClientNarrative;
        }
      }
    } catch (e) {
      console.error("[briefing] narrative failed:", e);
    }
  }

  const sections = clients.map((c) => {
    const n = narratives[c.name];
    const delta = c.rateThisWeek != null && c.rateLastWeek != null ? c.rateThisWeek - c.rateLastWeek : null;
    const rateLine = c.rateThisWeek == null
      ? "No probes this period yet."
      : `Mention rate: <strong style="color:#f5f5f3;">${c.rateThisWeek}%</strong>${delta != null ? ` (${delta >= 0 ? "+" : ""}${delta} vs last period)` : " (baseline)"}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskList = (ts: any[]) => ts.map((t) => `• ${t.task}${t.due_date ? ` <span style="color:#6a6a64;">(due ${t.due_date})</span>` : ""}`).join("<br/>");
    return [
      monoLabel(`${c.name} · ${c.trade} · ${c.city}`),
      paragraph(rateLine),
      n?.status ? paragraph(n.status) : "",
      n?.wins?.length ? paragraph(`<span style="color:#22c55e;">Wins:</span><br/>${n.wins.map((w) => `• ${w}`).join("<br/>")}`) : "",
      (n?.risks?.length || c.flips.some((f) => f.startsWith("LOST"))) ? paragraph(`<span style="color:#ef4444;">Watch:</span><br/>${[...(n?.risks ?? []), ...c.flips.filter((f) => f.startsWith("LOST"))].map((r) => `• ${r}`).join("<br/>")}`) : "",
      n?.say_to_client ? paragraph(`<span style="color:#E6FF00;">Say to them:</span> &ldquo;${n.say_to_client}&rdquo;`) : "",
      c.tasks6Signal.length ? paragraph(`<strong style="color:#f5f5f3;">6 Signal / AI this period:</strong><br/>${taskList(c.tasks6Signal)}`) : "",
      c.tasksClient.length ? paragraph(`<strong style="color:#f5f5f3;">Client must do:</strong><br/>${taskList(c.tasksClient)}`) : "",
      c.tasksTotal ? paragraph(`<span style="color:#6a6a64;">Plan progress: ${c.tasksDone}/${c.tasksTotal} tasks done.</span>`) : "",
    ].filter(Boolean).join("");
  });

  const emailed = await sendEmail({
    to: ALERT_TO(),
    subject: `📋 Briefing — ${clients.length} client${clients.length > 1 ? "s" : ""}`,
    html: emailShell([heading("This period, per client."), ...sections].join("")),
  });

  return { clients: clients.length, emailed };
}
