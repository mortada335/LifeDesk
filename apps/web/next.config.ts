import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/categories",
        destination: "/dashboard/categories",
        permanent: false,
      },
      {
        source: "/items",
        destination: "/dashboard/items",
        permanent: false,
      },
      {
        source: "/calendar",
        destination: "/dashboard/calendar",
        permanent: false,
      },
      {
        source: "/activity",
        destination: "/dashboard/activity",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:4000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
