"use client";

import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn } from "@/lib/utils";
import { ReactNode, useContext } from "react";

export default function DataViewBody<T>({
  render,
  className,
}: {
  render: Record<"table" | "cards", (item: T, i: number) => ReactNode>;
  className?: string;
}) {
  const { data, layout } = useContext(DataViewContext);

  if (data.length <= 0)
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 pt-80 text-4xl font-bold">
        <span className="text-red-800">لا توجد بيانات!</span>
        <span>حاول تغيير معايير التصفية أو حاول مجدداً في وقت لاحق</span>
      </div>
    );

  if (layout === "cards")
    return (
      <div
        className={cn(
          "grid max-h-full grid-cols-4 gap-20 overflow-y-auto p-16 pe-97",
          className,
        )}
      >
        {data.map(render[layout])}
      </div>
    );

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {data.map(render[layout])}
    </div>
  );
}
