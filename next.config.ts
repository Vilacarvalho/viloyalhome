import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

// This app lives inside a folder of a larger repo. Pin the Turbopack root here
// so Next doesn't climb up to the parent lockfile and try to compile it.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
};

export default nextConfig;
