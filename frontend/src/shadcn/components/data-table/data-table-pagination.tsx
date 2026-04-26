"use client";

import { Table as TanStackTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

import { toHindiDigits } from "@/lib/utils";

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
        {toHindiDigits(currentPage + 1)} / {toHindiDigits(pageCount)}
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
