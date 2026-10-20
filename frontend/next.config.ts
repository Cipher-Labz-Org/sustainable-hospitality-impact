import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(frontendDir, "..");

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer"],
  outputFileTracingRoot: repoRoot,
  outputFileTracingExcludes: {
    "*": [
      "../Images/**",
      "../scripts/**",
      "../CHECKLIST*",
      "../*.pdf",
      "../.git/**",
      "../frontend/.next/**",
      "../backend/node_modules/**",
    ],
  },
  turbopack: {
    root: repoRoot,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    proxyClientMaxBodySize: "20mb",
  },
};

export default nextConfig;
