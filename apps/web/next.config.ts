import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kenangan/ui", "@kenangan/lib", "@kenangan/config"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default nextConfig;

