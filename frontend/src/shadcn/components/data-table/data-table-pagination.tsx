"use client";

import { Table as TanStackTable } from "@tanstack/react-table";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
    <div className="mt-8 flex items-center justify-center" dir="rtl">
      <div className="flex items-center gap-1 rounded-full bg-[#f3f4f6] px-4 py-2">
        {/* Previous page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={isLoading || !table.getCanPreviousPage()}
          className="h-8 w-8 rounded-full text-[#667085] hover:bg-transparent hover:text-[#1F1F1F] disabled:opacity-40"
          aria-label="الصفحة السابقة"
        >
          <ArrowRight className="h-5 w-5 stroke-[1.5]" />
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1 px-2">
          {getPages().map((pageIndex) => (
            <Button
              key={pageIndex}
              variant="ghost"
              size="icon"
              onClick={() => goToPage(pageIndex)}
              disabled={isLoading}
              aria-current={pageIndex === currentPage ? "page" : undefined}
              className={cn(
                "h-7 w-10 rounded-[8px] font-['Inter'] text-[1.4rem] font-medium transition-colors",
                pageIndex === currentPage
                  ? "bg-[#C8D0CB] text-[#1F1F1F] hover:bg-[#b8c2bc]" // لون الصفحة النشطة
                  : "text-[#667085] hover:bg-gray-200/50 hover:text-[#1F1F1F]",
              )}
            >
              {pageIndex + 1}
            </Button>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isLoading || !table.getCanNextPage()}
          className="h-8 w-8 rounded-full text-[#667085] hover:bg-transparent hover:text-[#1F1F1F] disabled:opacity-40"
          aria-label="الصفحة التالية"
        >
          <ArrowLeft className="h-5 w-5 stroke-[1.5]" />
        </Button>
      </div>
    </div>
  );
}
