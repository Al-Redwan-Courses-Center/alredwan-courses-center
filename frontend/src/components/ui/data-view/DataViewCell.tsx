"use client";

import { createContext, type ReactNode, useContext } from "react";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn } from "@/lib/utils";

/**
 * Column index supplied by `DataViewRowLegacy` to cells it cannot clone
 * directly (e.g. cells rendered through a wrapper component).
 */
export const DataViewCellIndexContext = createContext<number | undefined>(
  undefined,
);

export interface DataViewCellLegacyProps {
  className?: string;
  title?: string;
  /** Column position in the row; injected by `DataViewRowLegacy`. */
  columnIndex?: number;
  /**
   * Caption shown before the value when rows stack on phones. In a header
   * cell it also overrides the text captured for that column.
   */
  label?: string;
  children?: ReactNode;
}

export default function DataViewCellLegacy({
  className = "",
  title = "",
  columnIndex,
  label,
  children = null,
}: DataViewCellLegacyProps) {
  const { headerLabels } = useContext(DataViewContext);
  const contextIndex = useContext(DataViewCellIndexContext);

  const index = columnIndex ?? contextIndex;
  const caption =
    label ?? (index !== undefined ? headerLabels[index] : undefined);
  const hasCaption = !!caption?.trim();

  return (
    <div
      className={cn(
        "content-center items-center p-4 has-[.status-badge]:py-0 nth-[1]:text-center nth-[n+4]:flex nth-[n+4]:justify-center",
        className,
        // Stacked card layout on phones: caption on the start side, value on the end side.
        "tablet-sm:!flex tablet-sm:!items-center tablet-sm:gap-4 tablet-sm:px-4 tablet-sm:py-2 tablet-sm:!text-start",
        hasCaption ? "tablet-sm:!justify-between" : "tablet-sm:!justify-end",
      )}
      {...(title ? { title } : {})}
    >
      {hasCaption && (
        <span className="tablet-sm:block hidden shrink-0 text-lg font-normal text-gray-400">
          {caption}
        </span>
      )}
      {/* `contents` keeps desktop layout untouched; on phones it groups the value at the end. */}
      <div className="tablet-sm:flex tablet-sm:min-w-0 tablet-sm:flex-1 tablet-sm:flex-wrap tablet-sm:items-center tablet-sm:justify-end tablet-sm:gap-3 tablet-sm:text-end contents">
        {children}
      </div>
    </div>
  );
}
