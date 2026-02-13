import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  /* ── Performance optimizations ── */
  compiler: {
    // Strip console.log in production (keep errors)
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  /* ── Image optimization ── */
  images: {
    formats: ["image/avif", "image/webp"],
  },

  /* ── Experimental perf features ── */
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
