import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows isolating the dev cache on Windows/OneDrive when needed.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images-assets.nasa.gov" },
      { protocol: "https", hostname: "assets.science.nasa.gov" },
      { protocol: "https", hostname: "trek.nasa.gov" },
    ],
  },
};

export default nextConfig;
