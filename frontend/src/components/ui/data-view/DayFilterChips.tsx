"use client";

import React from "react";
import { cn } from "@/lib/utils";

const days = [
  { label: "S", full: "السبت" },
  { label: "S", full: "الأحد" },
  { label: "M", full: "الاثنين" },
  { label: "T", full: "الثلاثاء" },
  { label: "W", full: "الأربعاء" },
  { label: "T", full: "الخميس" },
  { label: "F", full: "الجمعة" },
];

export default function DayFilterChips({
  selectedDay,
  onSelect,
}: {
  selectedDay?: string;
  onSelect?: (day: string) => void;
}) {
  return (
    <div className="flex items-center gap-12">
      <span className="font-medad text-olive-800 text-[1.4rem]">
        اختر اليوم
      </span>
      <div className="rounded-12 flex flex-row-reverse items-center gap-6 bg-stone-100 p-4">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(day.full)}
            className={cn(
              "rounded-8 flex h-36 w-36 items-center justify-center text-[1.2rem] font-bold transition-all",
              selectedDay === day.full
                ? "bg-olive-600 text-white shadow-md"
                : "bg-white text-stone-400 hover:bg-stone-50",
            )}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}
