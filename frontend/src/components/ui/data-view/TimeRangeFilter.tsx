"use client";

import React from "react";
import ArrowDownHead from "@/components/icons/ArrowDownHead";

export default function TimeRangeFilter() {
  return (
    <div className="flex items-center gap-12">
      <span className="font-medad text-olive-800 text-[1.4rem]">
        اختر الوقت
      </span>
      <div className="flex items-center gap-8">
        <div className="rounded-12 flex items-center gap-8 border border-stone-200 bg-stone-100 px-12 py-6">
          <span className="text-[1.2rem] text-stone-500">من</span>
          <div className="rounded-8 flex min-w-[80px] cursor-pointer items-center justify-between gap-4 border border-stone-100 bg-white px-8 py-2">
            <span className="text-[1.2rem]">6:00 am</span>
            <ArrowDownHead className="h-8 w-8 text-stone-400" />
          </div>
        </div>
        <div className="rounded-12 flex items-center gap-8 border border-stone-200 bg-stone-100 px-12 py-6">
          <span className="text-[1.2rem] text-stone-500">إلى</span>
          <div className="rounded-8 flex min-w-[80px] cursor-pointer items-center justify-between gap-4 border border-stone-100 bg-white px-8 py-2">
            <span className="text-[1.2rem]">9:00 pm</span>
            <ArrowDownHead className="h-8 w-8 text-stone-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
