import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  // The brief names the endpoints /feed, /swipe and /matches; expose them at those paths too.
  async rewrites() {
    return ["feed", "swipe", "matches"].map((name) => ({ source: `/${name}`, destination: `/api/${name}` }));
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "randomuser.me" }],
  },
};

export default nextConfig;
