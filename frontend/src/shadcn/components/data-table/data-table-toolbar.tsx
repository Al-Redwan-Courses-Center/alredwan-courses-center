"use client";

import { type SortingState, type Table } from "@tanstack/react-table";
import React from "react";
import { ChevronDown, Search } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { DataTableFilterConfig } from "./types";
import { NO_SORT_VALUE } from "./toolbar-shared";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
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

  if (!searchKey && !filters.length && !showColumnVisibilityToggle) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {searchKey && (
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <Search className="text-olive-400 h-6 w-6 shrink-0" />
          <Input
            id="data-table-search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              const value = e.target.value;
              table.getColumn(searchKey)?.setFilterValue(value);
              onSearchChange?.(value);
            }}
            disabled={isLoading}
            className="h-auto w-full border-none bg-transparent text-[1.6rem] shadow-none placeholder:text-gray-500 focus-visible:ring-0"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => {
          const currentValue =
            (table.getColumn(filter.columnId)?.getFilterValue() as
              | string
              | undefined) ?? "all";
          const selectedOption = filter.options.find(
            (option) => option.value === currentValue,
          );

          return (
            <Select
              key={filter.columnId}
              value={currentValue}
              onValueChange={(value) =>
                table.getColumn(filter.columnId)?.setFilterValue(value)
              }
              disabled={isLoading}
              dir="rtl"
            >
              <SelectTrigger variant="pill" size="lg" className="flex-1">
                <SelectValue>
                  {filter.label}: {selectedOption?.label ?? "الكل"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" variant="pill">
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} size="lg">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {showColumnVisibilityToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 rounded-full border-gray-200 bg-white px-5 text-[1.45rem] text-gray-700"
              >
                إخفاء / إظهار
                <ChevronDown className="ms-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-right">
              <DropdownMenuLabel className="text-[1.35rem]">
                الأعمدة
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const header = column.columnDef.header;
                  const headerLabel =
                    typeof header === "string" ? header : column.id;

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                      className="cursor-pointer text-[1.35rem]"
                    >
                      {headerLabel}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {showMobileSortDropdown && sortableColumns.length > 0 && (
        <div className="tablet:flex hidden items-center gap-3">
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
            <SelectTrigger variant="pill" size="lg" className="flex-1">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent align="start" variant="pill">
              <SelectItem value={NO_SORT_VALUE} size="lg">
                بدون ترتيب
              </SelectItem>
              {sortableColumns.map((col) => {
                const headerStr =
                  typeof col.columnDef.header === "string"
                    ? col.columnDef.header
                    : col.id;
                return (
                  <React.Fragment key={col.id}>
                    <SelectItem value={`${col.id}:asc`} size="lg">
                      {headerStr} ↑
                    </SelectItem>
                    <SelectItem value={`${col.id}:desc`} size="lg">
                      {headerStr} ↓
                    </SelectItem>
                  </React.Fragment>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
