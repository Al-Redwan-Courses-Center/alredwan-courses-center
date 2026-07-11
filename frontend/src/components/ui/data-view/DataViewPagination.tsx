"use client";

import ArrowLeft from "@/components/icons/ArrowLeft";
import ArrowRight from "@/components/icons/ArrowRight";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn, toHindiDigits } from "@/lib/utils";
import { useContext } from "react";

const paginationBtnStyles = cn(
  "text-olive-400 h-auto w-5 mobile-lg:w-[2rem] mobile:w-[2.5rem] disabled:pointer-events-none disabled:text-gray-600",
);

export function DataViewPaginationLegacy() {
  const { numPages, page, nextPage, prevPage, setPage } =
    useContext(DataViewContext);

  if (numPages <= 0) return null;

  return (
    <div className="relative flex items-center justify-center gap-10 max-[1000px]:gap-4 mt-auto pb-10 max-[1000px]:pb-4 pt-4 w-full flex-wrap">
      <button
        disabled={page - 1 < 1}
        onClick={prevPage}
        className={cn(paginationBtnStyles)}
      >
        <ArrowRight className={cn("h-auto w-full")} />
      </button>

      <div className="flex items-center gap-3">
        {Array.from({ length: numPages }, (num, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setPage(pageNum)}
            className={cn(
              "hover:bg-olive-100 aspect-square h-auto w-10 max-[1000px]:w-8 mobile-lg:w-[3.5rem] mobile:w-[4.5rem] content-center rounded-[0.8rem] text-2xl max-[1000px]:text-xl mobile-lg:text-[2rem] mobile:text-[2.6rem] font-bold text-gray-600 transition-colors",
              page === pageNum &&
                "bg-olive-100 pointer-events-none text-gray-900",
            )}
          >
            {toHindiDigits(pageNum)}
          </button>
        ))}
      </div>

      <button
        disabled={page + 1 > numPages}
        onClick={nextPage}
        className={paginationBtnStyles}
      >
        <ArrowLeft className={cn("h-auto w-full")} />
      </button>
    </div>
  );
}
