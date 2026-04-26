"use client";

import { type SortingState, type Table } from "@tanstack/react-table";
import React from "react";
import { Search } from "lucide-react";

import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { DataTableFilterConfig } from "./types";
import { NO_SORT_VALUE } from "./toolbar-shared";

interface DataCardsToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder: string;
  searchValue: string;
  filters: DataTableFilterConfig[];
  isLoading: boolean;
  onSearchChange?: (searchValue: string) => void;
}

export function DataCardsToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder,
  searchValue,
  filters,
  isLoading,
  onSearchChange,
}: DataCardsToolbarProps<TData>) {
  const sortableColumns = table
    .getAllColumns()
    .filter((col) => col.getCanSort());
  const activeSortCol = (table.getState().sorting as SortingState)[0];
  const currentSortValue = activeSortCol
    ? `${activeSortCol.id}:${activeSortCol.desc ? "desc" : "asc"}`
    : NO_SORT_VALUE;

  if (!searchKey && !filters.length && !sortableColumns.length) {
    return null;
  }

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {searchKey && (
        <div className="flex w-full flex-1 items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-4 shadow-sm md:max-w-md">
          <Search className="text-olive-400 h-6 w-6 shrink-0" />
          <Input
            id="data-cards-search"
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

      {sortableColumns.length > 0 && (
        <div className="flex w-full items-center gap-3 md:w-auto">
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
            <SelectTrigger variant="pill" size="lg">
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

      {filters.length > 0 && (
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
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
                <SelectTrigger variant="pill" size="lg">
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
        </div>
      )}
    </div>
  );
}
