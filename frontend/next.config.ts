import type { NextConfig } from "next";

// https://api.dicebear.com/7.x/avataaars/svg?seed=Student127&gender=male

const nextConfig: NextConfig = {
  // ========== تحسينات الصور ==========
  images: {
    // تفعيل تنسيقات حديثة (AVIF أصغر من WebP)
    formats: ['image/avif', 'image/webp'],
    
    // أحجام الأجهزة المختلفة للـ Responsive Images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
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
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // ✅ إنتاج ملفات مستقلة لـ Docker (مدعوم)
  output: "standalone",

  // ========== إعدادات TypeScript ==========
  typescript: {
    ignoreBuildErrors: true,
  },

  // ========== الـ Headers والـ Caching ==========
  async headers() {
    return [
      // ===== 1. Security Headers =====
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },

      // ===== 2. Caching للـ Images (سنة كاملة) =====
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ===== 3. Caching للـ Fonts (سنة كاملة) =====
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },

      // ===== 4. Caching للـ JS & CSS (سنة كاملة) =====
      // تم دمجها مع الـ static أعلاه

      // ===== 5. Caching للـ HTML (ساعة) =====
      {
        source: "/:path*.html",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=59",
          },
        ],
      },

      // ===== 6. Caching للـ API Routes (5 دقائق) =====
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=59",
          },
        ],
      },

      // ===== 7. منع Caching للـ Dashboard =====
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },

      // ===== 8. Caching للصفحات العامة (ساعة) =====
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/courses/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/instructors/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/about",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/contact-us",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/activities",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  // ========== Redirects ==========
  async redirects() {
    return [];
  },

  // ========== إزالة Trailing Slash ==========
  trailingSlash: false,
};

export default nextConfig;