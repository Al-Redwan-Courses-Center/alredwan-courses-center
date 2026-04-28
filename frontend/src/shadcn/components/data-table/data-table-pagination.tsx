"use client";

import { Table as TanStackTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

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

  if (pageCount <= 1) return null;

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

  // Sliding window: max 5 pages visible
  const getPages = (): number[] => {
    if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i);
    let start = Math.max(0, currentPage - 2);
    const end = Math.min(pageCount - 1, start + 4);
    if (end - start < 4) start = Math.max(0, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    // dir="rtl" makes pages render 3 2 1 left-to-right matching the Figma design
    <div className="mt-6 flex items-center justify-center" dir="rtl">
      <div className="flex items-center gap-[4px] rounded-[10px] bg-[#EAECF0] px-[8px] py-[4px]">
        {/* Previous page — right arrow in RTL */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={isLoading || !table.getCanPreviousPage()}
          className="h-[27px] w-[27px] rounded-lg text-[#5A6473] hover:bg-[#D1D5DB]/60 disabled:opacity-40"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>

        {/* Page number buttons */}
        {getPages().map((pageIndex) => (
          <Button
            key={pageIndex}
            variant="ghost"
            size="icon"
            onClick={() => goToPage(pageIndex)}
            disabled={isLoading}
            aria-current={pageIndex === currentPage ? "page" : undefined}
            className={cn(
              "h-[27px] w-[27px] rounded-lg font-['Inter'] text-[1.35rem] leading-5 font-medium",
              pageIndex === currentPage
                ? "bg-olive-100 text-olive-700 hover:bg-olive-100"
                : "text-[#667085] hover:bg-[#D1D5DB]/60",
            )}
          >
            {pageIndex + 1}
          </Button>
        ))}

        {/* Next page — left arrow in RTL */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isLoading || !table.getCanNextPage()}
          className="h-[27px] w-[27px] rounded-lg text-[#5A6473] hover:bg-[#D1D5DB]/60 disabled:opacity-40"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
