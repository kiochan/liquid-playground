import type { NextConfig } from "next/types";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        fs: {
          as: false,
        },
        path: {
          as: false,
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
