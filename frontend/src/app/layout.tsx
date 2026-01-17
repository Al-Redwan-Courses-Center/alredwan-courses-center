import AuthProvider from "@/providers/AuthProvider";
import type { Metadata, Viewport } from "next";
import { El_Messiri } from "next/font/google";
import localFont from "next/font/local";
import { ReactNode } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./globals.css";
import ToastProvider from "@/providers/ToastProvider";

const medad = localFont({
  src: "./fonts/medad-platinum.ttf",
  variable: "--font-medad",
});

const messiri = El_Messiri({
  variable: "--font-messiri",
  subsets: ["arabic"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: {
    template: "%s | واحة الرضوان التعليمية",
    default: "واحة الرضوان التعليمية",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar">
      <body
        className={`${medad.variable} ${messiri.variable} grid min-h-dvh antialiased`}
        dir="rtl"
      >
        <ToastProvider />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
