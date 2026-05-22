"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Refresh({ className }: { className?: string }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRefresh = () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    router.refresh();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "bg-olive-300 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 text-white active:scale-95 border-none outline-none",
        isRefreshing ? "animate-spin cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
      title="تحديث"
      aria-label="تحديث البيانات"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21v-5h5" />
      </svg>
    </button>
  );
}
