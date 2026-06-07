import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["hardware-cesarean-lasso.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

export default nextConfig