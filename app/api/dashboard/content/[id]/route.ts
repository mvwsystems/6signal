import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { getContentPost, updateContentPost, deleteContentPostDraft } from "../../../../lib/db";
import { publishContentPost } from "../../../../lib/content";

// GET    → the full post row (poll while status === "generating")
// PATCH  → edit draft fields (title, slug, meta_description, summary, article_html, faqs)
// POST   → publish to the client's GitHub repo (atomic commit → Netlify deploy)
// DELETE → remove a draft (published posts are protected)

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const post = await getContentPost(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

const EDITABLE = ["title", "slug", "meta_description", "summary", "article_html", "faqs"] as const;

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  let body: Record<string, unknown> | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const fields: Record<string, unknown> = {};
  for (const k of EDITABLE) if (body && k in body) fields[k] = body[k];
  // Archive / unarchive: hides the post from the default Articles list
  // without touching its status or the published page on the client site.
  if (body && typeof body.archived === "boolean") {
    fields.archived_at = body.archived ? new Date().toISOString() : null;
  }
  if (typeof fields.slug === "string") {
    fields.slug = fields.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }
  if (!Object.keys(fields).length) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  const ok = await updateContentPost(id, fields);
  return NextResponse.json({ ok });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const result = await publishContentPost(id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed." }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteContentPostDraft(id);
  return NextResponse.json({ ok });
}
