import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
