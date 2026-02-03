import type { NextConfig } from "next";

// https://api.dicebear.com/7.x/avataaars/svg?seed=Student127&gender=male

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mockmind-api.uifaces.co",
        port: "",
        pathname: "/content/human/**",
      },
      {
        protocol: "https",
        hostname: "d2pi0n2fm836iz.cloudfront.net",
        port: "",
        pathname: "/435672/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        port: "",
        pathname: "/7.x/avataaars/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/todays-schedule",
        permanent: true,
      },
      // {
      //   source: "/dashboard/my-courses/:id",
      //   destination: "/dashboard/my-courses/:id/lectures",
      //   permanent: true,
      // },
    ];
  },

  output: "standalone",
};

export default nextConfig;
