"use client";

import ArrowDownHead from "@/components/icons/ArrowDownHead";
import Button from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  dropdownMenuContentStyles,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn } from "@/lib/utils";
import { useContext } from "react";

export default function DataViewFilterLegacy() {
  const { filterConfig } = useContext(DataViewContext);
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const filters = searchParams.get("filter")?.split(",") || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-[50px] min-w-[120px] w-full px-16 rounded-full bg-white border border-stone-100 flex items-center justify-between gap-10 transition-all hover:bg-stone-50 active:scale-95">
          <ArrowDownHead className="w-10 h-10 text-stone-400" />
          <span className="text-[1.2rem] font-medium text-stone-600">اختيار حسب</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          dropdownMenuContentStyles,
          "relative z-150 rounded-none border-none",
        )}
      >
        {Object.entries(filterConfig).map(([key, config]) => (
          <DropdownMenuCheckboxItem
            key={key}
            className={cn(
              "cursor-pointer px-10 text-3xl hover:bg-gray-400",
              filters.includes(key) && "bg-olive-100",
            )}
            checked={filters.includes(key)}
            onClick={() =>
              mutateSearchParams([
                {
                  key: "filter",
                  val: filters.includes(key)
                    ? filters.filter((filter) => filter !== key).join(",")
                    : [...filters, key].join(","),
                },
                {
                  key: "page",
                  val: "",
                },
              ])
            }
          >
            {(config as { key: string; label: string }).label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
