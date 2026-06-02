"use client";

import EmptyState from "@/components/ui/EmptyState";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn } from "@/lib/utils";
import { ReactNode, useContext } from "react";

export default function DataViewBodyLegacy<T>({
  render,
  className,
}: {
  render: Record<"table" | "cards", (item: T, i: number) => ReactNode>;
  className?: string;
}) {
  const { data, layout } = useContext(DataViewContext);

  if (data.length <= 0)
    return (
      <EmptyState
        className="pt-80"
        title="لا توجد بيانات!"
        description="حاول تغيير معايير التصفية أو حاول مجدداً في وقت لاحق"
      />
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
