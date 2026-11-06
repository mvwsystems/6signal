import { MetadataRoute } from "next";
import { BASE } from "./lib/site";

// Private, transactional, or thin routes. They already carry noindex meta,
// but robots.txt keeps crawlers from spending budget on them at all.
const DISALLOW = [
  "/api/",
  "/dashboard",
  "/audit-results",
  "/strategy-brief",
  "/preview-funnel",
  "/c/",
  "/brand",
  "/brand.html",
  "/start/confirmed",
];

// AI crawlers named explicitly. The practice sells AI visibility; the site
// must be readable by every engine it audits. A blanket `*` allow already
// covers them — listing them is a signal of intent and survives a future
// tightening of the default rule.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "Applebot",
  "Applebot-Extended",
  "DuckAssistBot",
  "Amazonbot",
  "meta-externalagent",
  "CCBot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
