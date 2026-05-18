import { MetadataRoute } from "next";
import { getAllPosts } from "./lib/blog";

const BASE = "https://6signal.co";
const UPDATED = "2026-05-18";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

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
    { url: `${BASE}/audit`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/work`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/visibility`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/services`, lastModified: UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/research`, lastModified: UPDATED, changeFrequency: "weekly", priority: 0.85 },
    ...posts.map((post) => ({
      url: `${BASE}/research/${post.slug}`,
      lastModified: post.date,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
