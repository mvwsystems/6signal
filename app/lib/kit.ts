// Kit (ConvertKit) subscriber sync. Best-effort like every outbound call in
// this codebase: the lead is already persisted in Supabase before this runs,
// so a Kit failure is logged and never surfaces to the visitor.
//
// Tag ids are account-specific.
export const KIT_TAG_MASTER = 20293305; // "6 SIGNAL" — every site subscriber
export const KIT_TAG_SERIES = 21549558; // "intelligent-contractor" — series opt-ins
export const KIT_TAG_PROFIT_LEAK = 23741394; // "profit-leak" — Field Guide No. 01 leads

export async function pushToKit(args: {
  email: string;
  firstName?: string;
  tagIds: number[];
}): Promise<void> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.warn("[kit] KIT_API_KEY not set; skipping Kit sync");
    return;
  }
  const headers = { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey };
  try {
    const create = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email_address: args.email,
        ...(args.firstName ? { first_name: args.firstName } : {}),
      }),
    });
    // 409 = already a subscriber; tagging below still applies.
    if (!create.ok && create.status !== 409) {
      throw new Error(`subscriber create ${create.status}`);
    }
    for (const tagId of args.tagIds) {
      const tag = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email_address: args.email }),
      });
      if (!tag.ok) throw new Error(`tag ${tagId} ${tag.status}`);
    }
  } catch (e) {
    console.error("[kit] sync failed:", e);
  }
}
