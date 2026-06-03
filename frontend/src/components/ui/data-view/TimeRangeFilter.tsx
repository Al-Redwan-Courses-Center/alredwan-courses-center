"use client";

import React from "react";
import ArrowDownHead from "@/components/icons/ArrowDownHead";

export default function TimeRangeFilter() {
  return (
    <div className="flex items-center gap-12">
      <span className="text-[1.4rem] font-medad text-olive-800">اختر الوقت</span>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-8 bg-stone-100 px-12 py-6 rounded-12 border border-stone-200">
           <span className="text-[1.2rem] text-stone-500">من</span>
           <div className="flex items-center gap-4 bg-white px-8 py-2 rounded-8 border border-stone-100 min-w-[80px] justify-between cursor-pointer">
              <span className="text-[1.2rem]">6:00 am</span>
              <ArrowDownHead className="w-8 h-8 text-stone-400" />
           </div>
        </div>
        <div className="flex items-center gap-8 bg-stone-100 px-12 py-6 rounded-12 border border-stone-200">
           <span className="text-[1.2rem] text-stone-500">إلى</span>
           <div className="flex items-center gap-4 bg-white px-8 py-2 rounded-8 border border-stone-100 min-w-[80px] justify-between cursor-pointer">
              <span className="text-[1.2rem]">9:00 pm</span>
              <ArrowDownHead className="w-8 h-8 text-stone-400" />
           </div>
        </div>
      </div>
    </div>
  );
}
