import "dotenv/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  images: {
    domains: ["localhost"],
  },
};
export default nextConfig;
