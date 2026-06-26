import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: "https://lab.bossint.ai/api/health",
      },
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
        source: "/api/chatlogs",
        destination: "https://lab.bossint.ai/api/chatlogs",
      },
      {
        source: "/api/generate-schema",
        destination: "https://lab.bossint.ai/api/generate-schema",
      },
      {
        source: "/api/stop-all",
        destination: "https://lab.bossint.ai/api/stop-all",
      },
      {
        source: "/api/downloads/:path*",
        destination: "https://lab.bossint.ai/api/downloads/:path*",
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
