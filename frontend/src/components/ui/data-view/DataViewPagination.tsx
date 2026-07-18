"use client";

import ArrowLeft from "@/components/icons/ArrowLeft";
import ArrowRight from "@/components/icons/ArrowRight";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { cn, toHindiDigits } from "@/lib/utils";
import { useContext } from "react";

const paginationBtnStyles = cn(
  "text-olive-400 mobile-lg:w-[2rem] mobile:w-[2.5rem] h-auto w-5 disabled:pointer-events-none disabled:text-gray-600",
);

export function DataViewPaginationLegacy() {
  const { numPages, page, nextPage, prevPage, setPage } =
    useContext(DataViewContext);

  if (numPages <= 0) return null;

  return (
    <div className="relative mt-auto flex w-full flex-wrap items-center justify-center gap-10 pt-4 pb-10 max-[1000px]:gap-4 max-[1000px]:pb-4">
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
              "hover:bg-olive-100 mobile-lg:w-14 mobile:w-18 mobile-lg:text-[2rem] mobile:text-[2.6rem] aspect-square h-auto w-10 content-center rounded-[0.8rem] text-2xl font-bold text-gray-600 transition-colors max-[1000px]:w-8 max-[1000px]:text-xl",
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
