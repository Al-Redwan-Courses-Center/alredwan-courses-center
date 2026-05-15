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

const baseStyles = cn(
  "shadow-soft w-96 rounded-[2rem_0] bg-gray-50 text-[1.6rem]",
);

const dropdownItemStyles = cn(
  "[direction:rtl;] flex cursor-pointer justify-between px-8 text-[1.6rem] transition-all hover:bg-gray-400",
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
      <DropdownMenuTrigger
        className={cn(
          baseStyles,
          "px-8 py-3 transition-colors hover:bg-gray-100",
        )}
      >
        <div className="flex items-center justify-between">
          {fieldName ? (
            <div className="flex items-center gap-4">
              <SortArrow className={cn(direction === "desc" && "rotate-180")} />
              <span>
                {
                  sortOptions.find((option) => fieldName === option.fieldName)
                    ?.label
                }
              </span>
            </div>
          ) : (
            <span className="font-semibold text-gray-600">ترتيب حسب</span>
          )}

          <ArrowDownHead className="text-gray-600" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(baseStyles, "relative z-150 rounded-none border-none")}
      >
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
              className={cn(dropdownItemStyles, isActive && "bg-olive-100")}
            >
              {option.label}
              <SortArrow className={cn(isActive && !isAsc && "rotate-180")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
