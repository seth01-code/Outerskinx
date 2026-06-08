import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["hardware-cesarean-lasso.ngrok-free.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "outerskinx.com" },
      { protocol: "https", hostname: "www.outerskinx.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
   experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
}

export default nextConfig