import { NextRequest, NextResponse } from "next/server";
import { briefingRoster, getProbeResults, listTrackedPrompts, listTasks } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "../../lib/email";

export const maxDuration = 300;

// Monday owner briefing: one email covering every client — trajectory, what
// changed in the AI answers this week, what to SAY to each client, and the
// week's agenda split into "AI/6Signal does" vs "client does". Fired by
// netlify/functions/briefing-cron.mts after the weekly probes.

const ALERT_TO = () => process.env.LEAD_ALERT_TO || "hello@6signal.co";

interface ClientNarrative { name: string; status: string; say_to_client: string; wins: string[]; risks: string[] }

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roster = await briefingRoster();
  if (!roster.length) return NextResponse.json({ ok: true, clients: 0, note: "nothing to brief" });

  // Assemble per-client facts: week-over-week engine rates, flipped prompts, open tasks.
  const clients = await Promise.all(
    roster.map(async (b) => {
      const [results, prompts, tasks] = await Promise.all([
        getProbeResults(b.id, 21),
        listTrackedPrompts(b.id),
        listTasks(b.id),
      ]);
      const promptText = Object.fromEntries(prompts.map((p) => [p.id, p.prompt]));
      const weekMs = 7 * 86400000;
      const now = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inWindow = (r: any, from: number, to: number) => { const t = new Date(String(r.run_at)).getTime(); return t >= from && t < to; };
      const thisWeek = results.filter((r) => inWindow(r, now - weekMs, now + 1));
      const lastWeek = results.filter((r) => inWindow(r, now - 2 * weekMs, now - weekMs));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rate = (rows: any[]) => (rows.length ? Math.round((100 * rows.filter((r) => r.mentioned).length) / rows.length) : null);
      // latest verdict per prompt|engine in each window → flips
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const latestBy = (rows: any[]) => { const m: Record<string, any> = {}; for (const r of rows) m[`${r.prompt_id}|${r.engine}`] = r; return m; };
      const cur = latestBy(thisWeek), prev = latestBy(lastWeek);
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
        rateThisWeek: rate(thisWeek),
        rateLastWeek: rate(lastWeek),
        flips: flips.slice(0, 6),
        probesThisWeek: thisWeek.length,
        tasks6Signal: openTasks.filter((t) => t.owner !== "Client").slice(0, 6),
        tasksClient: openTasks.filter((t) => t.owner === "Client").slice(0, 4),
        tasksDone: tasks.filter((t) => t.status === "done").length,
        tasksTotal: tasks.length,
      };
    })
  );

  // One Claude call writes the narrative for all clients.
  let narratives: Record<string, ClientNarrative> = {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const facts = clients.map((c) => ({
      name: c.name, trade: c.trade, city: c.city,
      mention_rate_this_week: c.rateThisWeek, mention_rate_last_week: c.rateLastWeek,
      changes: c.flips, probes_this_week: c.probesThisWeek,
      tasks_done: c.tasksDone, tasks_total: c.tasksTotal,
    }));
    const system = `You write Matt Vincent Walker's Monday briefing for his AI-visibility practice (6 Signal). For EACH client given, write: "status" (2 plain sentences on trajectory — honest, specific, no fluff), "say_to_client" (the exact 1-2 sentences Matt should say to that client this week — concrete, confident, references real numbers), "wins" (0-3 short bullets), "risks" (0-2 short bullets). Ground everything ONLY in the facts given; if there is no probe data yet, say the baseline is being established. Return ONLY JSON: { "clients": [ { "name": "", "status": "", "say_to_client": "", "wins": [], "risks": [] } ] }`;
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

  // Compose the email.
  const sections = clients.map((c) => {
    const n = narratives[c.name];
    const delta = c.rateThisWeek != null && c.rateLastWeek != null ? c.rateThisWeek - c.rateLastWeek : null;
    const rateLine = c.rateThisWeek == null
      ? "No probes this week yet."
      : `Mention rate: <strong style="color:#f5f5f3;">${c.rateThisWeek}%</strong>${delta != null ? ` (${delta >= 0 ? "+" : ""}${delta} vs last week)` : " (baseline)"}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskList = (ts: any[]) => ts.map((t) => `• ${t.task}${t.due_date ? ` <span style="color:#6a6a64;">(due ${t.due_date})</span>` : ""}`).join("<br/>");
    return [
      monoLabel(`${c.name} · ${c.trade} · ${c.city}`),
      paragraph(rateLine),
      n?.status ? paragraph(n.status) : "",
      n?.wins?.length ? paragraph(`<span style="color:#22c55e;">Wins:</span><br/>${n.wins.map((w) => `• ${w}`).join("<br/>")}`) : "",
      (n?.risks?.length || c.flips.some((f) => f.startsWith("LOST"))) ? paragraph(`<span style="color:#ef4444;">Watch:</span><br/>${[...(n?.risks ?? []), ...c.flips.filter((f) => f.startsWith("LOST"))].map((r) => `• ${r}`).join("<br/>")}`) : "",
      n?.say_to_client ? paragraph(`<span style="color:#E6FF00;">Say to them:</span> &ldquo;${n.say_to_client}&rdquo;`) : "",
      c.tasks6Signal.length ? paragraph(`<strong style="color:#f5f5f3;">6 Signal / AI this week:</strong><br/>${taskList(c.tasks6Signal)}`) : "",
      c.tasksClient.length ? paragraph(`<strong style="color:#f5f5f3;">Client must do:</strong><br/>${taskList(c.tasksClient)}`) : "",
      c.tasksTotal ? paragraph(`<span style="color:#6a6a64;">Plan progress: ${c.tasksDone}/${c.tasksTotal} tasks done.</span>`) : "",
    ].filter(Boolean).join("");
  });

  const emailed = await sendEmail({
    to: ALERT_TO(),
    subject: `📋 Monday briefing — ${clients.length} client${clients.length > 1 ? "s" : ""}`,
    html: emailShell([heading("This week, per client."), ...sections].join("")),
  });

  return NextResponse.json({ ok: true, clients: clients.length, emailed });
}
