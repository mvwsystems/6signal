import { MetadataRoute } from "next";

const BASE = "https://6signal.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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
  ];
}
