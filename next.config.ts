import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite aislar la caché de desarrollo en Windows/OneDrive cuando sea necesario.
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
