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
          "laptop-sm:grid-cols-3 tablet:grid-cols-2 grid w-full grid-cols-4 gap-4 p-4 max-sm:grid max-sm:grid-cols-1 sm:gap-6 sm:p-8 lg:gap-8",
          className,
        )}
      >
        {data.map(render[layout])}
      </div>
    );

  return (
    <div
      className={cn(
        // Rows stack into cards on phones, so the body no longer needs to grow past the viewport.
        "tablet-sm:min-w-0 flex w-full min-w-max flex-col gap-6",
        className,
      )}
    >
      {data.map(render[layout])}
    </div>
  );
}
