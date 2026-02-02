import type { NextConfig } from "next";
//       "https://d2pi0n2fm836iz.cloudfront.net/435672/0125202313192463d12c5c84b80.jpg",

const nextConfig: NextConfig = {
  images: {
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
