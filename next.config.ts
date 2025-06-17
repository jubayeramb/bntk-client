import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.sql$/,
      use: "raw-loader",
    });

    // Handle Node.js modules that aren't compatible with client-side bundling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
