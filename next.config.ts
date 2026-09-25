import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first: product uploads can be 2–3 MB originals.
    formats: ["image/avif", "image/webp"],
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
