/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native module (OG image rasterizer) — must load at runtime, not bundle.
  serverExternalPackages: ["@resvg/resvg-js"],
  async rewrites() {
    return [
      // Brand kit — a self-contained static HTML doc served at a clean URL.
      { source: "/brand", destination: "/brand.html" },
    ];
  },
  async headers() {
    return [
      // Share-by-link resource; keep it out of search indexes.
      {
        source: "/brand",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/brand.html",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/research",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/research/:slug",
        permanent: true,
      },
      {
        source: "/services",
        destination: "/capabilities",
        permanent: true,
      },
      {
        // The old audit explainer described a free-call flow that no longer
        // exists; the $27 self-serve page is the real front door now.
        source: "/audit",
        destination: "/visibility-check",
        permanent: true,
      },
      {
        // Short, speakable link for the free 15-minute consult (business
        // cards, voicemail, ads). Points off-site to Calendly.
        source: "/call",
        destination: "https://calendly.com/mvw-mattvincentwalker/6-signal-free-15-min-consult",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
