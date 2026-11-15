import { pushAlert } from "./notify";

// "Immediate" alerts (spec §6 route "immediate"). Matt chose to get these in
// his Claude Duet chat, so the target is configurable rather than hard-coded:
//   ALERT_WEBHOOK_URL → JSON POST { title, message, severity, link, at } to
//                       whatever relays it to the chat (Casey's automation).
//   NTFY_TOPIC        → phone push, as a backup, if set.
// Best-effort: an alert that can't be delivered is logged, never thrown, so
// it can't break the action that raised it.

export async function sendAlert(a: { title: string; message: string; severity?: "high" | "medium" | "low"; link?: string }) {
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  const sends: Promise<unknown>[] = [];
  if (url) {
    sends.push(fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, severity: a.severity ?? "high", at: new Date().toISOString(), source: "6signal-command-center" }),
    }).then((r) => { if (!r.ok) console.error("[alerts] webhook answered", r.status); })
      .catch((e) => console.error("[alerts] webhook failed:", e)));
  }
  sends.push(pushAlert({ title: a.title, message: a.message, priority: a.severity === "low" ? "default" : "urgent", tags: "rotating_light" }));
  if (!url && !process.env.NTFY_TOPIC) console.warn("[alerts] no ALERT_WEBHOOK_URL or NTFY_TOPIC set; alert only logged:", a.title);
  await Promise.all(sends);
}
