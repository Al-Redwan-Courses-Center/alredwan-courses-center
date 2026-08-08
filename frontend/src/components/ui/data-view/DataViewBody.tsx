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
          "laptop-sm:grid-cols-3 tablet:grid-cols-2 mobile-lg:grid-cols-1 tablet:gap-10 mobile-lg:p-8 tablet:pe-8 grid grid-cols-4 gap-20 p-16",
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
