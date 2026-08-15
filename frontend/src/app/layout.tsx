import AuthProvider from "@/providers/AuthProvider";
import type { Metadata, Viewport } from "next";
import { El_Messiri, Inter } from "next/font/google";
import localFont from "next/font/local";
import { ReactNode } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./globals.css";
import ToastProvider from "@/providers/ToastProvider";
import LocalizationProvider from "@/providers/LocalizationProvider";

const medad = localFont({
  src: "./fonts/medad-platinum.ttf",
  variable: "--font-medad",
});

const messiri = El_Messiri({
  variable: "--font-messiri",
  subsets: ["arabic", "latin"],
  weight: "variable",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | واحة الرضوان التعليمية",
    default: "واحة الرضوان التعليمية",
  },
  description: "منارة تعليمية تجمع بين نور الدين وقوة العلم، لتنشئة جيل متدين وواعٍ، قادر على خدمة دينه ووطنه. نقدم باقة شاملة من دورات تحفيظ القرآن والأنشطة.",
  keywords: ["تعليم", "قرآن", "تحفيظ", "أنشطة", "أطفال", "إسلامي", "تطوير مهارات"],
  openGraph: {
    title: "واحة الرضوان التعليمية",
    description: "علمٌ يُزهر، وإيمانٌ يُثمر. واحة الرضوان لبناء شخصية الطفل المسلم المتكاملة.",
    type: "website",
    locale: "ar_EG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar">
      <body
        className={`${medad.variable} ${messiri.variable} ${inter.variable} grid min-h-dvh antialiased`}
        dir="rtl"
      >
        <ToastProvider />
        <AuthProvider>
          <LocalizationProvider>{children}</LocalizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
