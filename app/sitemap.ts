import { MetadataRoute } from "next";
import { getAllPosts } from "./lib/blog";

const BASE = "https://6signal.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getAllPosts();

  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/roofers`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/plumbers`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/hvac`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/electricians`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/remodelers`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/garage-doors`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/landscaping`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tree-service`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/pest-control`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/foundation-concrete`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/commercial-contractors`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/method`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/audit`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/visibility`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    ...posts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
