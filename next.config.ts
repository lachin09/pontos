import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first: product uploads can be 2–3 MB originals.
    formats: ["image/avif", "image/webp"],
    // Every photo gets a unique path when uploaded, so optimized copies can
    // stay cached for a year instead of being regenerated every 4 hours.
    minimumCacheTTL: 31536000,
    // Next 16 only serves the qualities listed here; 30 is for the tiny
    // blurred placeholders behind every product photo.
    qualities: [30, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "gszipxnrxzhwpvgrqxvf.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/product-images/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
