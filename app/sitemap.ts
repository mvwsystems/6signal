import { MetadataRoute } from "next";
import { getAllPosts } from "./lib/blog";
import { listPublishedBriefings } from "./lib/db";

const BASE = "https://6signal.co";
const UPDATED = "2026-07-27";

// Newsletter issues publish from /dashboard, not from a deploy, so the sitemap
// refreshes on its own rather than waiting for the next build to find them.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = getAllPosts();
  const briefings = await listPublishedBriefings();

  return [
    { url: `${BASE}/`, lastModified: UPDATED, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/roofers`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/plumbers`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/hvac`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/electricians`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/remodelers`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/garage-doors`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/landscaping`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tree-service`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/pest-control`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/foundation-concrete`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/commercial-contractors`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/method`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/dallas-fort-worth`, lastModified: "2026-10-26", changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/apple`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/apple-checklist`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/profit-leak`, lastModified: "2026-09-19", changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/work`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/websites`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/care`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/stabilize`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/systemize`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/follow-up`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/start`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/inquire`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/strategy-call`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/visibility`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/capabilities`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/ai-visibility-check`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/visibility-check`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/strategy-brief`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/operator`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/research`, lastModified: UPDATED, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/research/ai-visibility-tools`, lastModified: UPDATED, changeFrequency: "weekly", priority: 0.82 },
    { url: `${BASE}/research/intelligent-contractor`, lastModified: UPDATED, changeFrequency: "weekly", priority: 0.82 },
    { url: `${BASE}/briefings`, lastModified: UPDATED, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${BASE}/research/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...briefings.map((issue) => ({
      url: `${BASE}/briefings/${issue.slug}`,
      lastModified: issue.published_at.slice(0, 10),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
