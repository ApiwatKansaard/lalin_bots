/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/webhook", destination: "/api/webhook" },
      { source: "/health", destination: "/api/health" },
    ];
  },
};

export default nextConfig;
