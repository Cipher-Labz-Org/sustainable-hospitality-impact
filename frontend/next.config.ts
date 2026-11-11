import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(frontendDir, "..");

const frontendNodeModules = path.join(frontendDir, "node_modules");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "sharp"],
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    "*": [
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "../Images/**",
      "../scripts/**",
      "../CHECKLIST*",
      "../*.pdf",
      "../.git/**",
      // Repo-root leftover from the pre-split app. Do not exclude frontend/.next:
      // Webpack NFT must keep webpack-runtime.js and server chunks for Vercel.
      "../.next/**",
      "../backend/node_modules/**",
    ],
  },
  turbopack: {
    root: repoRoot,
  },
  webpack: (config) => {
    const modules = [
      frontendNodeModules,
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : []),
      "node_modules",
    ];
    config.resolve.modules = [...new Set(modules)];
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
