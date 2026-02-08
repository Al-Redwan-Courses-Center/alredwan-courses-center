"use client";

import { Calendar } from "@/components/ui/Calendar";
import { cn, formatDate } from "@/lib/utils";
import { useState } from "react";
import { DateRange } from "react-day-picker";

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

  return (
    <div>
      <div className="mb-10 flex items-center gap-10 text-2xl">
        <div className="bg-olive-300 flex min-w-60 flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3">
          <span className="text-gray-100">تاريخ البداية </span>
          <span className="text-3xl">
            {formatDate(date?.from || new Date())}
          </span>
        </div>

        <span>إلى</span>

        <div className="bg-olive-300 flex min-w-60 flex-col gap-2 rounded-t-2xl border-b-2 border-gray-500 px-6 py-3">
          <span className="text-gray-100">تاريخ النهاية </span>
          <span className="text-3xl">{formatDate(date?.to || new Date())}</span>
        </div>
      </div>

      <Calendar
        mode="range"
        numberOfMonths={2}
        defaultMonth={defaultMonth}
        dir="ltr"
        className="shadow-soft bg-gray-50 py-0"
        classNames={{
          root: cn("w-full"),
          weekdays: cn("mb-5 gap-5"),
          weekday: cn("text-3xl"),
          day: cn("text-2xl"),
          months: cn(
            "flex-row gap-0 [&>div:first-of-type]:border-r [&>div:first-of-type]:border-gray-500",
          ),
          month: cn("gap-10 px-5 py-10"),
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
  );
}
