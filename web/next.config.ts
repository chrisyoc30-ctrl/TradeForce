import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* ESLint runs in CI; production builds (e.g. Railway) should not require eslint on the server. */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* With a root package.json + workspaces, point Turbopack at this app folder. */
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
