"use client";

import { type SortingState, type Table } from "@tanstack/react-table";
import React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { DataTableFilterConfig, DataTableSearchConfig } from "./types";
import { NO_SORT_VALUE } from "./toolbar-shared";

import { SearchInput } from "../ui/search-input";

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
      className="relative z-[100] mb-8 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center"
    >
      {resolvedSearches.map((cfg, idx) => {
        const colValue =
          idx === 0 && onSearchChange
            ? searchValue
            : ((table.getColumn(cfg.searchKey)?.getFilterValue() as string) ??
              "");

        return (
          <div
            key={`dt-search-${cfg.searchKey}`}
            className="w-full md:w-auto md:flex-1"
          >
            <SearchInput
              id={`dt-search-${cfg.searchKey}`}
              placeholder={cfg.placeholder}
              value={colValue}
              disabled={isLoading}
              containerClassName="shadow-soft w-full min-w-[250px]"
              onChange={(e) => {
                const value = e.target.value;
                table.getColumn(cfg.searchKey)?.setFilterValue(value);
                if (idx === 0) onSearchChange?.(value);
              }}
            />
          </div>
        );
      })}

      {hasSelects && (
        <div className="flex w-full flex-row flex-wrap items-center gap-4 md:w-auto md:flex-nowrap">
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
                  className="w-[calc(50%-8px)] md:w-[17.4rem]"
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
                className="w-[calc(50%-8px)] md:w-[17.4rem]"
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
                  className="shadow-soft focus-visible:ring-olive-300/40 flex h-[50px] w-[calc(50%-8px)] items-center justify-between rounded-tl-[20px] rounded-br-[20px] border-none bg-gray-50 px-6 text-[1.4rem] font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:ring-[3px] md:w-[17.4rem]"
                >
                  الأعمدة
                  <ChevronDown className="text-olive-400 ms-2 !size-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" variant="toolbar">
                <DropdownMenuLabel variant="toolbar">
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
                        variant="toolbar"
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
