import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ Allow Payload media hosted on your Vercel domain
      {
        protocol: "https",
        hostname: "aleximports.vercel.app",
        pathname: "/api/media/file/**",
      },
      // ✅ Allow localhost for development
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
