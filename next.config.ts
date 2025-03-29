import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.sql$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
