// GitHub publisher for client sites. Uses the Git Data API so one publish =
// one atomic commit (post + sitemap + llms.txt + index together), which also
// triggers the client site's Netlify deploy. Requires GITHUB_TOKEN (fine-grained
// PAT with Contents read/write on the client repos); reads of public repos fall
// back to unauthenticated raw.githubusercontent.com.

const API = "https://api.github.com";

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "6signal-publisher",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, { ...init, headers: { ...headers(), ...(init?.headers as Record<string, string>) } });
  if (!r.ok) throw new Error(`GitHub ${init?.method ?? "GET"} ${path} → ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as Promise<T>;
}

export async function getDefaultBranch(repo: string): Promise<string> {
  const info = await gh<{ default_branch: string }>(`/repos/${repo}`);
  return info.default_branch || "main";
}

/** Read one file from the repo (default branch). Returns null on 404. */
export async function getRepoFile(repo: string, path: string, branch = "main"): Promise<string | null> {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${path}`, {
    headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : undefined,
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub raw ${repo}/${path} → ${r.status}`);
  return r.text();
}

export async function listRepoPaths(repo: string, branch = "main"): Promise<string[]> {
  const tree = await gh<{ tree: Array<{ path: string; type: string }> }>(`/repos/${repo}/git/trees/${branch}?recursive=1`);
  return (tree.tree || []).filter((t) => t.type === "blob").map((t) => t.path);
}

export interface CommitFile { path: string; content?: string; base64?: string }

/** Commit a set of files (create or update) to the default branch in ONE
 *  commit. Text files inline into the tree; binary files (base64) go through
 *  the blob API first. */
export async function commitFiles(repo: string, message: string, files: CommitFile[]): Promise<{ sha: string; branch: string }> {
  if (!githubConfigured()) throw new Error("GITHUB_TOKEN is not configured — cannot publish.");
  if (!files.length) throw new Error("No files to commit.");
  const branch = await getDefaultBranch(repo);
  const ref = await gh<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${branch}`);
  const headSha = ref.object.sha;
  const headCommit = await gh<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${headSha}`);
  const entries = await Promise.all(files.map(async (f) => {
    if (f.base64 != null) {
      const blob = await gh<{ sha: string }>(`/repos/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: f.base64, encoding: "base64" }),
      });
      return { path: f.path, mode: "100644", type: "blob", sha: blob.sha };
    }
    return { path: f.path, mode: "100644", type: "blob", content: f.content ?? "" };
  }));
  const tree = await gh<{ sha: string }>(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }),
  });
  const commit = await gh<{ sha: string }>(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  });
  await gh(`/repos/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, branch };
}
