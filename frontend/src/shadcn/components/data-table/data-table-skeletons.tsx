"use client";

import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";
import { cn } from "@/lib/utils";

interface DataTableRowsSkeletonProps {
  rowsCount: number;
  columnsCount: number;
}

export function DataTableRowsSkeleton({
  rowsCount,
  columnsCount,
}: DataTableRowsSkeletonProps) {
  return Array.from({ length: rowsCount }).map((_, rowIndex) => (
    <TableRow key={`loading-row-${rowIndex}`}>
      {Array.from({ length: columnsCount || 1 }).map((__, cellIndex) => (
        <TableCell
          key={`loading-cell-${rowIndex}-${cellIndex}`}
          className="py-4"
        >
          <Skeleton className="mx-auto h-5 w-4/5" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

interface DataTableMobileSkeletonProps {
  count: number;
}

export function DataTableMobileSkeleton({
  count,
}: DataTableMobileSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col">
          {/* Header skeleton - matches AccordionTrigger figma-mobile */}
          <div className="flex h-12 items-center justify-between rounded-tl-[20px] rounded-br-[20px] bg-olive-100 px-6 shadow-soft">
            <div className="flex items-center gap-5">
              <Skeleton className="h-5 w-32 bg-gray-300/50" />
              <Skeleton className="h-3 w-16 bg-gray-300/40" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full bg-gray-300/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DataCardsSkeletonProps {
  count: number;
  gridClassName?: string;
}

export function DataCardsSkeleton({
  count,
  gridClassName,
}: DataCardsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        gridClassName,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`card-loading-${index}`}
          className="space-y-4 rounded-[1.2rem] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
