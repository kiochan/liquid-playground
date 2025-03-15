import type { NextConfig } from "next/types";
import "dotenv/config";

const PORT = String(process.env.PORT || 3000);

const nextConfig: NextConfig = {
  env: {
    PORT,
  },
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
