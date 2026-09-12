"use client";

import { type ReactNode, useContext } from "react";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

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
          "grid grid-cols-4 laptop-sm:grid-cols-3 tablet:grid-cols-2 max-sm:flex max-sm:w-full max-sm:overflow-x-auto max-sm:touch-pan-x max-sm:pb-4 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-8",
          className,
        )}
      >
        {data.map(render[layout])}
      </div>
    );

  return (
    <div className={cn("flex w-full min-w-max flex-col gap-6", className)}>
      {data.map(render[layout])}
    </div>
  );
}
