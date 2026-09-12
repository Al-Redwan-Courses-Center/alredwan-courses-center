"use client";

import { useContext } from "react";
import ArrowDownHead from "@/components/icons/ArrowDownHead";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  dropdownMenuContentStyles,
} from "@/components/ui/DropdownMenu";
import { DataViewContext } from "@/components/ui/data-view/DataView";
import { useMutateSearchParams } from "@/hooks/useMutateSearchParams";
import { cn } from "@/lib/utils";

export default function DataViewFilterLegacy() {
  const { filterConfig } = useContext(DataViewContext);
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  
  // جلب الفلتر المختار حالياً كقيمة واحدة فقط بدلاً من مصفوفة
  const currentFilter = searchParams.get("filter") || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-[50px] w-full min-w-[120px] items-center justify-between gap-10 rounded-full border border-stone-100 bg-white px-16 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:bg-stone-50 active:scale-95">
          <ArrowDownHead className="h-10 w-10 text-stone-400" />
          <span className="mobile-lg:text-[1.6rem] mobile:text-[2rem] text-[1.2rem] font-medium text-stone-600">
            اختيار حسب
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn(
          dropdownMenuContentStyles,
          "relative z-150 rounded-none border-none"
        )}
      >
        {Object.entries(filterConfig).map(([key, config]) => {
          const isSelected = currentFilter === key;

          return (
            <DropdownMenuCheckboxItem
              key={key}
              className={cn(
                "mobile-lg:text-[1.8rem] mobile:text-[2.2rem] cursor-pointer px-10 text-[1.4rem] hover:bg-gray-400",
                isSelected && "bg-olive-100"
              )}
              checked={isSelected}
              onClick={() =>
                mutateSearchParams([
                  {
                    key: "filter",
                    val: isSelected ? "" : key,
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
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}