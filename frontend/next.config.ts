import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed&gender=male
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/7.x/avataaars/svg/**",
      },
    ],
  },

  output: "standalone",
};

export default nextConfig;
