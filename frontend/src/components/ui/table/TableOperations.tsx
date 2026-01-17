"use client";

import ArrowDownHead from "@/components/icons/ArrowDownHead";
import SearchIcon from "@/components/icons/SearchIcon";
import SortArrow from "@/components/icons/SortArrow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import Input from "@/components/ui/Input";
import TableFilter from "@/components/ui/table/TableFilter";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn, debounceFn } from "@/lib/utils";
import { useMemo, useState } from "react";

const baseStyles = cn(
  "shadow-soft w-105 rounded-[2rem_0] bg-gray-50 text-[1.8rem]",
);

const dropdownItemStyles = cn(
  "[direction:rtl;] flex cursor-pointer justify-between px-10 text-[1.8rem] transition-all hover:bg-gray-400",
);

const sortOptions = [
  {
    label: "المحاضرة",
    fieldName: "lecture",
  },
  {
    label: "الدورة",
    fieldName: "course",
  },
  {
    label: "وقت البداية",
    fieldName: "startTime",
  },
  {
    label: "وقت النهاية",
    fieldName: "endTime",
  },
  {
    label: "الحالة",
    fieldName: "status",
  },
];

export function TableOperations() {
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const currentSort = searchParams.get("sort-by");
  const [fieldName, direction] = currentSort?.split("-") || [];
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const debouncedSearch = useMemo(
    () =>
      debounceFn((value: string) => mutateSearchParams("search", value), 500),
    [mutateSearchParams],
  );

  return (
    <div className="relative z-100 mb-14 flex items-center gap-32">
      {/*
        //
        // MARK: SEARCH
        //
      */}
      <Input
        icon={<SearchIcon className="text-olive-300" />}
        placeholder="ابحث عن دورة أو محاضرة"
        inputStyles={cn("w-228")}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
        value={searchQuery}
      />

      {/*
        //
        // MARK: SORT
        //
      */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            baseStyles,
            "px-10 py-4 transition-colors hover:bg-gray-100",
          )}
        >
          <div className="flex items-center justify-between">
            {fieldName ? (
              <div className="flex items-center gap-4">
                <SortArrow
                  className={cn(direction === "desc" && "rotate-180")}
                />
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
                  mutateSearchParams(
                    "sort-by",
                    `${option.fieldName}-${isAsc ? "desc" : "asc"}`,
                  )
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

      <TableFilter />
    </div>
  );
}
