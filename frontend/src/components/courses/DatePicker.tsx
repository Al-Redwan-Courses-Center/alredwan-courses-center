"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useMediaQuery } from "usehooks-ts";
import { Calendar } from "@/components/ui/Calendar";
import { cn, formatDate } from "@/lib/utils";

export default function DatePicker({
  range,
  onRangeChange,
  defaultMonth,
}: {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  defaultMonth: Date;
}) {
  const [date, setDate] = useState<DateRange | undefined>(range);
  // Two months side by side do not fit on tablets and phones.
  const isNarrow = useMediaQuery("(max-width: 900px)", {
    initializeWithValue: false,
  });

  return (
    <div className="min-w-0">
      <div className="tablet-sm:gap-4 mb-10 flex flex-wrap items-center gap-10 text-2xl">
        <div className="bg-olive-300 tablet-sm:min-w-0 tablet-sm:flex-1 flex min-w-60 flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3">
          <span className="text-gray-100">تاريخ البداية </span>
          <span className="tablet-sm:text-2xl text-3xl">
            {formatDate(date?.from || new Date())}
          </span>
        </div>

        <span>إلى</span>

        <div className="bg-olive-300 tablet-sm:min-w-0 tablet-sm:flex-1 flex min-w-60 flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3">
          <span className="text-gray-100">تاريخ النهاية </span>
          <span className="tablet-sm:text-2xl text-3xl">
            {formatDate(date?.to || new Date())}
          </span>
        </div>
      </div>

      <div className="no-scrollbar min-w-0 overflow-x-auto">
        <Calendar
          mode="range"
          numberOfMonths={isNarrow ? 1 : 2}
          defaultMonth={defaultMonth}
          dir="ltr"
          className="shadow-soft bg-gray-50 py-0"
          classNames={{
            root: cn("w-full"),
            weekdays: cn("tablet-sm:gap-2 mb-5 gap-5"),
            weekday: cn("tablet-sm:text-xl text-3xl"),
            day: cn("tablet-sm:text-lg text-2xl"),
            months: cn(
              "flex-row gap-0 [&>div:first-of-type]:border-r [&>div:first-of-type]:border-gray-500 [&>div:only-of-type]:border-r-0",
            ),
            month: cn("tablet-sm:px-2 tablet-sm:py-6 gap-10 px-5 py-10"),
            nav: cn(
              "top-9 left-1/2 w-95/100 -translate-x-[50%] self-center [&_svg]:size-8 [&_svg]:-scale-x-100 [&_svg]:stroke-3 [&_svg]:text-gray-500",
            ),
            caption_label: cn("text-3xl font-semibold text-gray-500"),
          }}
          selected={date}
          onSelect={(date) => {
            if (!date) return;

            onRangeChange(date);
            setDate(date);
          }}
        />
      </div>
    </div>
  );
}
