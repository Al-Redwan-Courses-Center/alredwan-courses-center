"use client";

import { Table as TanStackTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

const HINDI_DIGITS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

function toHindi(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => HINDI_DIGITS[d] ?? d);
}

interface DataTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  onPrevious?: (nextPage: number, currentPage: number) => void;
  onNext?: (nextPage: number, currentPage: number) => void;
  onPageChange?: (nextPage: number, currentPage: number) => void;
  isLoading?: boolean;
}

export function DataTablePagination<TData>({
  table,
  onPrevious,
  onNext,
  onPageChange,
  isLoading = false,
}: DataTablePaginationProps<TData>) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  if (pageCount <= 0) return null;

  const goToPrevious = () => {
    if (!table.getCanPreviousPage()) return;

    const nextPage = currentPage;
    const current = currentPage + 1;
    const nextPageIndex = currentPage - 1;

    onPrevious?.(nextPage, current);
    onPageChange?.(nextPage, current);
    table.setPageIndex(nextPageIndex < 0 ? 0 : nextPageIndex);
  };

  const goToNext = () => {
    if (!table.getCanNextPage()) return;

    const nextPage = currentPage + 2;
    const current = currentPage + 1;
    const nextPageIndex = currentPage + 1;

    onNext?.(nextPage, current);
    onPageChange?.(nextPage, current);
    table.setPageIndex(nextPageIndex);
  };

  return (
    <div className="mt-6 flex items-center justify-center gap-3" dir="rtl">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPrevious}
        disabled={isLoading || !table.getCanPreviousPage()}
        className="rounded-full border-gray-200 px-5 text-[1.35rem] text-gray-700"
      >
        <ChevronRight className="h-5 w-5" />
        السابق
      </Button>

      <div className="rounded-full bg-gray-100 px-4 py-2 text-[1.3rem] font-bold text-gray-700">
        {toHindi(currentPage + 1)} / {toHindi(pageCount)}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNext}
        disabled={isLoading || !table.getCanNextPage()}
        className="rounded-full border-gray-200 px-5 text-[1.35rem] text-gray-700"
      >
        التالي
        <ChevronLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}
