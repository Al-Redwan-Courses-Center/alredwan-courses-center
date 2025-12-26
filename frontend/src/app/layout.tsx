import type { Metadata } from "next";
import localFont from "next/font/local";
import { El_Messiri } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/AuthProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${medad.variable} ${messiri.variable} grid min-h-dvh overflow-x-clip antialiased`}
        dir="rtl"
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
