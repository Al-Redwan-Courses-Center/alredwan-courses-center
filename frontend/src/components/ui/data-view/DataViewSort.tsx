"use client";

import ArrowDownHead from "@/components/icons/ArrowDownHead";
import SortArrow from "@/components/icons/SortArrow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn } from "@/lib/utils";
import { useContext } from "react";

const dropdownItemStyles = cn(
  "[direction:rtl;] mobile-lg:text-[1.8rem] mobile:text-[2.2rem] flex cursor-pointer justify-between px-10 py-6 text-[1.4rem] transition-all hover:bg-gray-100",
);

export default function DataViewSortLegacy() {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const currentSort = searchParams.get("sort-by");
  const [fieldName, direction] = currentSort?.split("-") || [];

  const { sortConfig } = useContext(DataViewContext);
  const sortOptions = Object.entries(sortConfig).map(([key, val]) => ({
    label: val.label,
    fieldName: key,
  }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-[50px] w-full min-w-[120px] items-center justify-between gap-10 rounded-full border border-stone-100 bg-white px-16 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:bg-stone-50 active:scale-95">
          <ArrowDownHead className="h-10 w-10 text-stone-400" />
          <div className="flex items-center gap-4">
            {fieldName ? (
              <div className="flex items-center gap-4">
                <SortArrow
                  className={cn(
                    direction === "desc" && "rotate-180",
                    "h-10 w-10",
                  )}
                />
                <span className="mobile-lg:text-[1.6rem] mobile:text-[2rem] text-[1.2rem] font-medium text-stone-600">
                  {
                    sortOptions.find((option) => fieldName === option.fieldName)
                      ?.label
                  }
                </span>
              </div>
            ) : (
              <span className="mobile-lg:text-[1.6rem] mobile:text-[2rem] text-[1.2rem] font-medium text-stone-600">
                ترتيب حسب
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="rounded-12 z-150 min-w-[160px] border border-stone-100 bg-white py-4 shadow-xl">
        {sortOptions.map((option, i) => {
          const isActive =
            currentSort && currentSort.startsWith(option.fieldName);
          const isAsc =
            currentSort && currentSort === `${option.fieldName}-asc`;

          return (
            <DropdownMenuItem
              key={i}
              onClick={() =>
                mutateSearchParams([
                  {
                    key: "sort-by",
                    val: `${option.fieldName}-${isAsc ? "desc" : "asc"}`,
                  },
                ])
              }
              className={cn(
                dropdownItemStyles,
                isActive && "bg-olive-50 text-olive-700",
              )}
            >
              <div className="flex w-full items-center justify-between gap-8">
                <span>{option.label}</span>
                <SortArrow
                  className={cn(
                    isActive && !isAsc && "rotate-180",
                    "h-10 w-10",
                  )}
                />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
