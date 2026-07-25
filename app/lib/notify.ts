// Instant phone push via ntfy (https://ntfy.sh). Best-effort like every other
// integration: no NTFY_TOPIC env -> logged warning, nothing breaks. The topic
// name is the only secret — use a long random one and set it in Netlify.

export async function pushAlert(args: {
  title: string;
  message: string;
  priority?: "urgent" | "high" | "default";
  tags?: string;
}): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.warn("[notify] NTFY_TOPIC not set — skipping push:", args.title);
    return;
  }
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        Title: args.title,
        Priority: args.priority ?? "default",
        Tags: args.tags ?? "fire",
      },
      body: args.message,
    });
  } catch (e) {
    console.error("[notify] push failed:", e);
  }
}
