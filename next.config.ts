import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets regression builds go to a separate folder (NEXT_DIST_DIR=.next-qa) so they never
  // overwrite the output of a running `next dev`. Unset, this is the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["192.168.1.4"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
