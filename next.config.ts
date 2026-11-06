import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/submenu/config_1/:size*",
        destination: "/api/imagemap/config_1/:size*",
      },
      {
        source: "/submenu/config_1.jpg/:size*",
        destination: "/api/imagemap/config_1/:size*",
      },
    ];
  },
};

export default nextConfig;
