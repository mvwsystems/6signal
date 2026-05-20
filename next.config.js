/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
};

module.exports = nextConfig;
