import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { createContentPost, listContentPosts, getBusiness, setBusinessGithubRepo, setPromptArticleDismissed } from "../../../lib/db";
import { suggestTopics } from "../../../lib/content";
import { githubConfigured } from "../../../lib/github";
import { enqueueWorker } from "../../../lib/enqueue";

// GET   ?businessId=            → { posts, topics, repo, githubReady }
// POST  { businessId, targetPrompt } → create draft row + enqueue generation → { pending: postId }
// PATCH { businessId, repo }    → set the client's GitHub repo ("owner/repo" or null)

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  const [posts, topics, business] = await Promise.all([
    listContentPosts(businessId),
    suggestTopics(businessId),
    getBusiness(businessId),
  ]);
  return NextResponse.json({ posts, topics, repo: business?.github_repo ?? null, githubReady: githubConfigured() });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string; targetPrompt?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const businessId = body?.businessId;
  const targetPrompt = (body?.targetPrompt ?? "").trim();
  if (!businessId || !targetPrompt) return NextResponse.json({ error: "businessId and targetPrompt required" }, { status: 400 });
  const postId = await createContentPost(businessId, targetPrompt);
  if (!postId) return NextResponse.json({ error: "Could not create the draft row." }, { status: 500 });
  const q = await enqueueWorker({ kind: "content-generate", postId, businessId });
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: 502 });
  return NextResponse.json({ pending: postId }, { status: 202 });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string; repo?: string | null; promptId?: string; topicDismissed?: boolean } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  // Archive/restore a topic suggestion (per tracked prompt).
  if (body.promptId && typeof body.topicDismissed === "boolean") {
    const ok = await setPromptArticleDismissed(body.promptId, body.topicDismissed);
    return NextResponse.json({ ok });
  }
  const repo = body.repo ? body.repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/+$/, "") : null;
  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) return NextResponse.json({ error: "repo must be owner/repo or a github.com URL" }, { status: 400 });
  const ok = await setBusinessGithubRepo(body.businessId, repo);
  return NextResponse.json({ ok, repo });
}
