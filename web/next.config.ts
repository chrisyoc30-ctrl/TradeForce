import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* With a root package.json + workspaces, point Turbopack at this app folder. */
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
