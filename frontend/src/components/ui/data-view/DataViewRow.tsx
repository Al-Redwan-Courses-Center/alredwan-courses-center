"use client";

import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn, cva } from "@/lib/utils";
import { ReactNode, useContext } from "react";

const rowStyles = cva(
  cn("shadow-soft text-2xl transition-all hover:bg-gray-400"),
  {
    variants: {
      intent: {
        header: cn(
          "bg-olive-100 hover:bg-olive-100 font-medad mb-6 rounded-[2rem_0] text-4xl text-gray-500",
        ),
        standard: cn("rounded-[0_2rem] bg-gray-50"),
        alternate: cn("rounded-[2rem_0] bg-gray-100"),
      },
    },
  },
);

export function DataViewRowLegacy({
  className,
  index,
  children,
}: {
  className?: string;
  index: number;
  children: ReactNode;
}) {
  const { columnSizing } = useContext(DataViewContext);

  return (
    <div
      className={cn(
        "grid overflow-hidden",
        columnSizing,
        rowStyles({
          intent:
            index >= 0
              ? index % 2 === 0
                ? "standard"
                : "alternate"
              : "header",
        }),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataViewHeaderLegacy({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { layout } = useContext(DataViewContext);

  if (layout === "cards") return null;

  return (
    <DataViewRowLegacy className={className} index={-1}>
      {children}
    </DataViewRowLegacy>
  );
}
