"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

export default function InfoTooltip({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-red-800 text-white transition-all outline-none hover:scale-105 hover:bg-red-700 active:scale-95",
            className,
          )}
          title="معلومات"
          aria-label="معلومات إضافية"
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="text-olive-900 border-olive-100/80 shadow-soft z-[9999] w-80 rounded-2xl border bg-white p-5 text-right text-xl leading-relaxed font-bold"
        dir="rtl"
      >
        <div className="flex flex-col gap-2">
          <p>{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
