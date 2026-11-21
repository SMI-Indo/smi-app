import type { NextConfig } from "next";
import { registrationOrigin, vanityRegistrationSource } from "./src/lib/registrationLinks";

const nextConfig: NextConfig = {
  async rewrites() {
    const origin = registrationOrigin();
    const host = origin ? [{ type: "host" as const, value: new URL(origin).hostname.replaceAll(".", "\\.") }] : null;
    return {
      beforeFiles: host ? [{ source: "/", has: host, destination: "/daftar" }] : [],
      afterFiles: [
        { source: "/daftar-:slug", destination: "/daftar/:slug" },
        ...(host ? [{ source: vanityRegistrationSource, has: host, destination: "/daftar/:slug" }] : []),
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

export default nextConfig;
