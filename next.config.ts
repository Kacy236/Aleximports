import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔴 THIS is the key line
  experimental: {
    forceSwcTransforms: true,
  },

  webpack: (config) => config,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aleximports.vercel.app",
        pathname: "/api/media/file/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/file/**",
      },
    ],
  },
};

export default withPayload(nextConfig);
