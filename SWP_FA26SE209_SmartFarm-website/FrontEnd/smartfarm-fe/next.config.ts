import type { NextConfig } from "next";

const backendBaseUrl = (
  process.env.API_BASE_URL
  ?? process.env.NEXT_PUBLIC_API_BASE_URL
  ?? "https://api.sumfas.id.vn"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
  },
  allowedDevOrigins: ["192.168.2.211"],
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
