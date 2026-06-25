import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "https://lab.bossint.ai/api/auth/:path*",
      },
      {
        source: "/api/agents/:path*",
        destination: "https://lab.bossint.ai/api/agents/:path*",
      },
      {
        source: "/api/stats",
        destination: "https://lab.bossint.ai/api/stats",
      },
      {
        source: "/api/presets",
        destination: "https://lab.bossint.ai/api/presets",
      },
      {
        source: "/api/settings",
        destination: "https://lab.bossint.ai/api/settings",
      },
      {
        source: "/api/users/:path*",
        destination: "https://lab.bossint.ai/api/users/:path*",
      },
      {
        source: "/api/admin/:path*",
        destination: "https://lab.bossint.ai/api/admin/:path*",
      },
      {
        source: "/v1/:path*",
        destination: "https://lab.bossint.ai/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
