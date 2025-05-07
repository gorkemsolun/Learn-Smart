import "dotenv/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  env: {
    BACKEND_API_URL: process.env.BACKEND_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "www.w3schools.com",
        pathname: "/howto/img_avatar.png",
      },
    ],
  },
};

export default nextConfig;
