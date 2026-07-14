import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.platform === "win32" ? undefined : "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cms.hieuchanlaptrinh.top" },
      { protocol: "http", hostname: "localhost" }
    ]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
