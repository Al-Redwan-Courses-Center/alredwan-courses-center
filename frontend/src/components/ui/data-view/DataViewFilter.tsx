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

export default function DataViewFilter() {
  const { filterConfig } = useContext(DataViewContext);
  const { searchParams, mutateSearchParams } = useMutateSearchParams();
  const filters = searchParams.get("filter")?.split(",") || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="light" size="wide">
          <div className="flex w-full items-center justify-between">
            <span>تصفية</span>
            <ArrowDownHead />
          </div>
        </Button>
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
