"use client";

import { useContext } from "react";
import ArrowLeft from "@/components/icons/ArrowLeft";
import ArrowRight from "@/components/icons/ArrowRight";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn, toHindiDigits } from "@/lib/utils";

const paginationBtnStyles = cn(
  "text-olive-400 h-auto w-5 mobile-lg:w-[2rem] mobile:w-[2.5rem] disabled:pointer-events-none disabled:text-gray-400 cursor-pointer",
);

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export function DataViewPaginationLegacy() {
  const { numPages, page, nextPage, prevPage, setPage } =
    useContext(DataViewContext);

  if (numPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, numPages);

  return (
    <div
      className="relative flex items-center justify-center gap-10 max-[1000px]:gap-4 mt-auto pb-10 max-[1000px]:pb-4 pt-4 w-full flex-wrap"
      dir="rtl"
    >
      <button
        disabled={page - 1 < 1}
        onClick={prevPage}
        className={cn(paginationBtnStyles)}
        aria-label="الصفحة السابقة"
      >
        <ArrowRight className={cn("h-auto w-full")} />
      </button>

      <div className="flex items-center gap-3">
        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-2xl text-gray-400 font-bold"
              >
                ...
              </span>
            );
          }

          const pageNumber = Number(pageNum);
          return (
            <button
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
              className={cn(
                "hover:bg-olive-100 aspect-square h-auto w-10 max-[1000px]:w-8 mobile-lg:w-14 mobile:w-18 content-center rounded-[0.8rem] text-2xl max-[1000px]:text-xl mobile-lg:text-[2rem] mobile:text-[2.6rem] font-bold text-gray-600 transition-colors cursor-pointer",
                page === pageNumber &&
                  "bg-olive-100 pointer-events-none text-gray-900",
              )}
            >
              {toHindiDigits(pageNumber)}
            </button>
          );
        })}
      </div>

      <button
        disabled={page + 1 > numPages}
        onClick={nextPage}
        className={paginationBtnStyles}
        aria-label="الصفحة التالية"
      >
        <ArrowLeft className={cn("h-auto w-full")} />
      </button>
    </div>
  );
}
