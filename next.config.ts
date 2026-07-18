import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing on a phone through an HTTPS tunnel (cloudflared, localtunnel,
  // ngrok). Next 16 blocks cross-origin dev requests unless the host is
  // allowlisted. Wildcards match the tunnel's changing subdomain, so there's no
  // need to edit this each time the tunnel URL changes.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
