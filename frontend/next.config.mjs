import "dotenv/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
