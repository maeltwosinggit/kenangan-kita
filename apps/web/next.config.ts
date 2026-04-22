import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kenangan/ui", "@kenangan/lib", "@kenangan/config"]
};

export default nextConfig;

