"use client";

import { type SortingState, type Table } from "@tanstack/react-table";
import React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { DataTableFilterConfig, DataTableSearchConfig } from "./types";
import { NO_SORT_VALUE } from "./toolbar-shared";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searches?: DataTableSearchConfig[];
  searchKey?: string;
  searchPlaceholder: string;
  searchValue: string;
  filters: DataTableFilterConfig[];
  showColumnVisibilityToggle: boolean;
  showMobileSortDropdown: boolean;
  isLoading: boolean;
  onSearchChange?: (searchValue: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  searches,
  searchKey,
  searchPlaceholder,
  searchValue,
  filters,
  showColumnVisibilityToggle,
  showMobileSortDropdown,
  isLoading,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const sortableColumns = table
    .getAllColumns()
    .filter((col) => col.getCanSort());
  const activeSortCol = (table.getState().sorting as SortingState)[0];
  const currentSortValue = activeSortCol
    ? `${activeSortCol.id}:${activeSortCol.desc ? "desc" : "asc"}`
    : NO_SORT_VALUE;

  const resolvedSearches: DataTableSearchConfig[] =
    searches && searches.length > 0
      ? searches
      : searchKey
        ? [{ searchKey, placeholder: searchPlaceholder }]
        : [];

  const hasSearch = resolvedSearches.length > 0;
  const hasFilters = filters.length > 0;
  const hasMobileSort = showMobileSortDropdown && sortableColumns.length > 0;
  const hasAnyContent =
    hasSearch || hasFilters || showColumnVisibilityToggle || hasMobileSort;

  if (!hasAnyContent) return null;

  return (
    <div className="mb-6 space-y-3">
      {/*
       * Toolbar row: search + selects share the same `bg-zinc-100 shadow` strip.
       * Desktop: all in one horizontal row.
       * On mobile the sort dropdown is shown separately below.
       */}
      <div
        className={cn(
          "flex items-stretch overflow-hidden",
          "rounded-tr-[20px] rounded-bl-[20px]",
          "bg-zinc-100",
          "shadow-[7px_6px_14.6px_0px_rgba(0,0,0,0.08)]",
        )}
        dir="rtl"
      >
        {/* ── Search inputs ── */}
        {resolvedSearches.map((cfg, idx) => {
          const colValue =
            idx === 0 && onSearchChange
              ? searchValue
              : ((table
                  .getColumn(cfg.searchKey)
                  ?.getFilterValue() as string) ?? "");

          return (
            <label
              key={cfg.searchKey}
              htmlFor={`dt-search-${cfg.searchKey}`}
              className={cn(
                "flex flex-1 cursor-text items-center gap-4 px-6 py-[1.1rem]",
                // Right-side divider when selects follow
                (hasFilters || hasMobileSort) && "border-l border-zinc-200",
              )}
            >
              <Search className="h-[1.8rem] w-[1.8rem] shrink-0 text-gray-500" />
              <input
                id={`dt-search-${cfg.searchKey}`}
                type="text"
                placeholder={cfg.placeholder ?? searchPlaceholder}
                value={colValue}
                onChange={(e) => {
                  const value = e.target.value;
                  table.getColumn(cfg.searchKey)?.setFilterValue(value);
                  if (idx === 0) onSearchChange?.(value);
                }}
                disabled={isLoading}
                className="w-full bg-transparent text-[1.5rem] text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-50"
              />
            </label>
          );
        })}

        {/* ── Filter selects ── */}
        {filters.map((filter) => {
          const currentValue =
            (table.getColumn(filter.columnId)?.getFilterValue() as
              | string
              | undefined) ?? "all";
          const selectedOption = filter.options.find(
            (o) => o.value === currentValue,
          );

          return (
            <Select
              key={filter.columnId}
              value={currentValue}
              onValueChange={(val) =>
                table.getColumn(filter.columnId)?.setFilterValue(val)
              }
              disabled={isLoading}
              dir="rtl"
            >
              <SelectTrigger
                className={cn(
                  // Match the toolbar strip: no independent bg/border/shadow
                  "h-auto min-w-[18rem] border-none bg-transparent px-6 py-[1.1rem] shadow-none",
                  "text-[1.5rem] font-medium text-gray-700",
                  "focus:ring-0 focus-visible:ring-0",
                  // Divider between items
                  "border-l border-zinc-200",
                  "rounded-none",
                )}
              >
                <SelectValue>
                  {selectedOption?.label ?? filter.label ?? "اختيار"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[18rem] text-right" dir="rtl">
                {filter.options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer text-[1.4rem]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {/* ── Mobile sort ── (shown inside the strip on desktop, hidden on true-mobile) */}
        {hasMobileSort && (
          <Select
            value={currentSortValue}
            onValueChange={(value) => {
              if (value === NO_SORT_VALUE) {
                table.setSorting([]);
                return;
              }
              const [id, dir] = value.split(":");
              table.setSorting([{ id, desc: dir === "desc" }]);
            }}
            disabled={isLoading}
            dir="rtl"
          >
            <SelectTrigger
              className={cn(
                "h-auto min-w-[18rem] border-none bg-transparent px-6 py-[1.1rem] shadow-none",
                "text-[1.5rem] font-medium text-gray-700",
                "focus:ring-0 focus-visible:ring-0",
                "border-l border-zinc-200",
                "rounded-none",
              )}
            >
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[18rem] text-right" dir="rtl">
              <SelectItem value={NO_SORT_VALUE} className="text-[1.4rem]">
                بدون ترتيب
              </SelectItem>
              {sortableColumns.map((col) => {
                const headerStr =
                  typeof col.columnDef.header === "string"
                    ? col.columnDef.header
                    : col.id;
                return (
                  <React.Fragment key={col.id}>
                    <SelectItem value={`${col.id}:asc`} className="text-[1.4rem]">
                      {headerStr} ↑
                    </SelectItem>
                    <SelectItem value={`${col.id}:desc`} className="text-[1.4rem]">
                      {headerStr} ↓
                    </SelectItem>
                  </React.Fragment>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {/* ── Column visibility toggle ── */}
        {showColumnVisibilityToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-auto rounded-none border-l border-zinc-200 px-6 py-[1.1rem]",
                  "bg-transparent text-[1.45rem] text-gray-700 shadow-none hover:bg-zinc-200/60",
                  "focus-visible:ring-0",
                )}
              >
                الأعمدة
                <ChevronDown className="ms-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-right">
              <DropdownMenuLabel className="text-[1.35rem]">
                إخفاء / إظهار الأعمدة
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => {
                  const label =
                    typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id;
                  return (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(v) => col.toggleVisibility(Boolean(v))}
                      className="cursor-pointer text-[1.35rem]"
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
