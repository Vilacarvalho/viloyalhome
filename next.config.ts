import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Pin the Turbopack workspace root to this project. Without it, a stray
// package-lock.json elsewhere on the machine (e.g. in the user's home folder)
// can be picked as the root and break the dev server. Must be an absolute path.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
  // Allow testing on a phone through an HTTPS tunnel (cloudflared, localtunnel,
  // ngrok). Next 16 blocks cross-origin dev requests unless the host is
  // allowlisted. Wildcards match the tunnel's changing subdomain.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
