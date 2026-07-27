import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface FaqItem {
  q: string;
  a: string;
}

export interface PostMeta {
  title: string;
  slug: string;
  description: string;
  date: string;
  category: string;
  author: string;
  readTime: string;
  featured: boolean;
  tags: string[];
  contentType?: string;
  // Content track: "visibility" (the six-signal library, default) or
  // "operations" (AI infrastructure — Stabilize/Systemize rungs).
  track: "visibility" | "operations";
  faq?: FaqItem[];
}

export interface Post extends PostMeta {
  content: string;
}

function getFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => /\.(mdx?|md)$/.test(f));
}

function parsePost(file: string): Post {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
  const { data, content } = matter(raw);
  return {
    title: data.title ?? "",
    slug: data.slug ?? file.replace(/\.(mdx?|md)$/, ""),
    description: data.description ?? "",
    date: data.date ? String(data.date) : "",
    category: data.category ?? "General",
    author: data.author ?? "Matt Vincent Walker",
    readTime: data.readTime ?? "5 min read",
    featured: Boolean(data.featured),
    tags: Array.isArray(data.tags) ? data.tags : [],
    contentType: data.contentType ?? undefined,
    track: data.track === "operations" ? "operations" : "visibility",
    faq: Array.isArray(data.faq) ? data.faq : undefined,
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  return getFiles()
    .map((file) => {
      const { content: _c, ...meta } = parsePost(file);
      return meta;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  for (const file of getFiles()) {
    const post = parsePost(file);
    if (post.slug === slug) return post;
  }
  return null;
}

export function getRelatedPosts(slug: string, category: string, limit = 2): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Append noon local time to prevent UTC midnight from rolling back a day in US timezones
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
