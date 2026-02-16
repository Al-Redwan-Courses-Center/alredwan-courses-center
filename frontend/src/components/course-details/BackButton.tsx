"use client";

import { useRouter } from "next/navigation";
import ArrowBackIcon from "@/components/icons/ArrowBackIcon";

interface BackButtonProps {
  href: string;
  label?: string;
}

export default function BackButton({
  href,
  label = "العودة إلى لوحة التحكم",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="text-olive-600 hover:text-olive-700 mb-8 flex items-center gap-3 text-2xl transition-colors sm:mb-4 sm:text-lg md:mb-6 md:gap-2 md:text-xl"
    >
      <ArrowBackIcon className="h-10 w-10 sm:h-6 sm:w-6 md:h-8 md:w-8" />
      {label}
    </button>
  );
}
