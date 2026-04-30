"use client";

import { Table as TanStackTable } from "@tanstack/react-table";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn, toHindiDigits } from "@/lib/utils";
import { Button } from "../ui/button";

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
  const currentPage = table.getState().pagination.pageIndex; // 0-based

  if (pageCount < 1) return null;

  const goToPrevious = () => {
    if (!table.getCanPreviousPage()) return;
    const next = currentPage - 1;
    table.setPageIndex(next);
    onPrevious?.(next + 1, currentPage + 1);
    onPageChange?.(next + 1, currentPage + 1);
  };

  const goToNext = () => {
    if (!table.getCanNextPage()) return;
    const next = currentPage + 1;
    table.setPageIndex(next);
    onNext?.(next + 1, currentPage + 1);
    onPageChange?.(next + 1, currentPage + 1);
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex === currentPage) return;
    table.setPageIndex(pageIndex);
    onPageChange?.(pageIndex + 1, currentPage + 1);
    if (pageIndex > currentPage) onNext?.(pageIndex + 1, currentPage + 1);
    else onPrevious?.(pageIndex + 1, currentPage + 1);
  };

  const getPages = (): number[] => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
    let start = Math.max(0, currentPage - 2);
    const end = Math.min(pageCount - 1, start + 4);
    if (end - start < 4) start = Math.max(0, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="mt-10 flex items-center justify-center gap-10" dir="rtl">
      {/* Previous page */}
      <Button
        variant="ghost"
        onClick={goToPrevious}
        disabled={isLoading || !table.getCanPreviousPage()}
        className="h-auto w-auto p-2 text-olive-400 hover:bg-transparent hover:text-olive-700 disabled:opacity-40"
        aria-label="الصفحة السابقة"
      >
        <ArrowRight className="!h-8 !w-8 stroke-[1.5]" />{" "}
      </Button>

      {/* Page number buttons */}
      <div className="flex items-center gap-3">
        {getPages().map((pageIndex) => (
          <Button
            key={pageIndex}
            variant="ghost"
            onClick={() => goToPage(pageIndex)}
            disabled={isLoading}
            aria-current={pageIndex === currentPage ? "page" : undefined}
            className={cn(
              "font-mesiri hover:bg-olive-100 aspect-square h-auto w-10 rounded-[0.8rem] p-0 text-2xl font-bold text-gray-600 transition-colors",
              pageIndex === currentPage &&
                "bg-olive-100 pointer-events-none text-gray-900",
            )}
          >
            {toHindiDigits(pageIndex + 1)}
          </Button>
        ))}
      </div>

      {/* Next page */}
      <Button
        variant="ghost"
        onClick={goToNext}
        disabled={isLoading || !table.getCanNextPage()}
        className="h-auto w-auto p-2 text-olive-400 hover:bg-transparent hover:text-olive-700 disabled:opacity-40"
        aria-label="الصفحة التالية"
      >
        <ArrowLeft className="!h-8 !w-8 stroke-[1.5]" />{" "}
      </Button>
    </div>
  );
}
