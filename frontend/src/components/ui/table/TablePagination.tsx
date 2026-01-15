"use client";

import ArrowLeft from "@/components/icons/ArrowLeft";
import ArrowRight from "@/components/icons/ArrowRight";
import { TableContext } from "@/components/ui/table/Table";
import { cn, toHindiDigits } from "@/lib/utils";
import { useContext } from "react";

const paginationBtnStyles = cn(
  "text-olive-400 h-auto w-10 disabled:pointer-events-none disabled:text-gray-600",
);

export function TablePagination() {
  const { numPages, page, nextPage, prevPage, setPage } =
    useContext(TableContext);

  return (
    <div className="absolute right-1/2 bottom-9 flex translate-x-[50%] items-center gap-10">
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
              "hover:bg-olive-100 aspect-square h-auto w-15 content-center rounded-2xl text-3xl font-bold text-gray-600 transition-colors",
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
