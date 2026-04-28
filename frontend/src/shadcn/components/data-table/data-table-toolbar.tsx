"use client";

import { type SortingState, type Table } from "@tanstack/react-table";
import React from "react";
import { ChevronDown, Search } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
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

  const resolvedSearches: DataTableSearchConfig[] = searches ?? [];

  const hasSearch = resolvedSearches.length > 0;
  const hasFilters = filters.length > 0;
  const hasMobileSort = showMobileSortDropdown && sortableColumns.length > 0;
  const hasSelects = hasFilters || hasMobileSort || showColumnVisibilityToggle;

  if (!hasSearch && !hasSelects) return null;

  return (
    <div
      dir="rtl"
      className="tablet:flex-row tablet:flex-wrap tablet:items-center tablet:justify-between tablet:gap-4 mb-6 flex flex-col gap-3"
    >
      {resolvedSearches.map((cfg, idx) => {
        const colValue =
          idx === 0 && onSearchChange
            ? searchValue
            : ((table.getColumn(cfg.searchKey)?.getFilterValue() as string) ??
              "");

        return (
          <label
            key={cfg.searchKey}
            htmlFor={`dt-search-${cfg.searchKey}`}
            className="flex h-12 min-h-12 w-full min-w-0 cursor-text items-center justify-end gap-4 rounded-tl-[20px] rounded-br-[20px] bg-[#f3f3f5] px-6"
          >
            <Search className="h-5 w-5 shrink-0 text-[#a0ae99]" />
            <Input
              id={`dt-search-${cfg.searchKey}`}
              variant="search"
              placeholder={cfg.placeholder}
              value={colValue}
              disabled={isLoading}
              onChange={(e) => {
                const value = e.target.value;
                table.getColumn(cfg.searchKey)?.setFilterValue(value);
                if (idx === 0) onSearchChange?.(value);
              }}
              className="text-[1.4rem] font-medium text-gray-600 placeholder:text-gray-600"
            />
          </label>
        );
      })}

      {hasSelects && (
        <div className="tablet:flex tablet:w-auto tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-3 flex w-full flex-col gap-3">
          {filters.map((filter) => {
            const currentValue =
              (table.getColumn(filter.columnId)?.getFilterValue() as
                | string
                | undefined) ?? "all";
            const selectedOption = filter.options.find(
              (option) => option.value === currentValue,
            );
            const triggerLabel =
              currentValue === "all"
                ? `${filter.label}: جميع الخيارات`
                : `${filter.label}: ${selectedOption?.label ?? filter.label}`;

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
                  variant="toolbar"
                  className="tablet:w-[17.4rem] w-full"
                >
                  <SelectValue>{triggerLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end" dir="rtl" variant="toolbar">
                  {filter.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      variant="toolbar"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

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
                variant="toolbar"
                className="tablet:w-[17.4rem] w-full"
              >
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent align="end" dir="rtl" variant="toolbar">
                <SelectItem value={NO_SORT_VALUE} variant="toolbar">
                  بدون ترتيب
                </SelectItem>
                {sortableColumns.map((col) => {
                  const headerStr =
                    typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id;
                  return (
                    <React.Fragment key={col.id}>
                      <SelectItem value={`${col.id}:asc`} variant="toolbar">
                        {headerStr} ↑
                      </SelectItem>
                      <SelectItem value={`${col.id}:desc`} variant="toolbar">
                        {headerStr} ↓
                      </SelectItem>
                    </React.Fragment>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {showColumnVisibilityToggle && (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="tablet:w-[17.4rem] flex h-12 w-full items-center justify-between rounded-tl-[20px] rounded-br-[20px] border-none bg-[#f3f3f5] px-4 text-[1.4rem] font-medium text-gray-600 hover:bg-[#ececef] focus-visible:ring-0"
                >
                  الأعمدة
                  <ChevronDown className="ms-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="tablet:w-[17.4rem] w-full rounded-tl-[20px] rounded-br-[20px] border-none bg-[#f3f3f5] p-2 text-right shadow-md"
              >
                <DropdownMenuLabel className="px-2 py-1.5 text-[1.35rem] font-semibold text-gray-700">
                  إخفاء / إظهار الأعمدة
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
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
                        onCheckedChange={(v) =>
                          col.toggleVisibility(Boolean(v))
                        }
                        className="cursor-pointer rounded-md py-2.5 pe-8 text-[1.35rem] transition-colors focus:bg-[#ececef] focus:text-gray-900"
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
