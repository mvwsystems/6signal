/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native module (OG image rasterizer) — must load at runtime, not bundle.
  serverExternalPackages: ["@resvg/resvg-js"],
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
    ];
  },
};

module.exports = nextConfig;
