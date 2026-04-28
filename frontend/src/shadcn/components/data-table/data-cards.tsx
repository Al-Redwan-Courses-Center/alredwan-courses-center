"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "./data-table-pagination";
import { DataCardsSkeleton } from "./data-table-skeletons";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataCardsProps } from "./types";
import { cn } from "@/lib/utils";

export function DataCards<TData, TValue>({
  columns,
  data,
  searches,
  renderCard,
  pageSize = 8,
  className,
  gridClassName,
  filters = [],
  paginationOptions,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  isLoading = false,
  loadingRowsCount,
  remoteState,
  onPaginationChange,
  onSortingChange,
  onFiltersChange,
  onSearchChange,
}: DataCardsProps<TData, TValue>) {
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [localPagination, setLocalPagination] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize,
    },
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const sorting = remoteState?.sorting ?? localSorting;
  const columnFilters = remoteState?.columnFilters ?? localColumnFilters;
  const isPageIndexControlled = remoteState?.pageIndex !== undefined;
  const pagination: PaginationState = {
    pageIndex: remoteState?.pageIndex ?? localPagination.pageIndex,
    pageSize: localPagination.pageSize,
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nextSorting = functionalUpdate(updater, sorting);
    if (!remoteState?.sorting) {
      setLocalSorting(nextSorting);
    }
    onSortingChange?.(nextSorting);
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater,
  ) => {
    const nextFilters = functionalUpdate(updater, columnFilters);
    if (!remoteState?.columnFilters) {
      setLocalColumnFilters(nextFilters);
    }
    onFiltersChange?.(nextFilters);
  };

  const handlePaginationStateChange: OnChangeFn<PaginationState> = (
    updater,
  ) => {
    const nextPagination = functionalUpdate(updater, pagination);
    if (!isPageIndexControlled) {
      setLocalPagination(nextPagination);
    } else {
      setLocalPagination((prev) => ({
        ...prev,
        pageSize: nextPagination.pageSize,
      }));
    }
    onPaginationChange?.(nextPagination.pageIndex, nextPagination.pageSize);
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: manualPagination ? (remoteState?.pageCount ?? 1) : undefined,
    manualPagination,
    manualFiltering,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: handlePaginationStateChange,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const effectiveLoadingRowsCount = loadingRowsCount ?? pageSize;
  const hasAvailableData =
    data.length > 0 || (manualPagination && (remoteState?.pageCount ?? 0) > 0);
  const firstSearchKey = searches?.[0]?.searchKey;
  const searchValue =
    remoteState?.searchValue ??
    (firstSearchKey
      ? (table.getColumn(firstSearchKey)?.getFilterValue() as string)
      : "") ??
    "";
  return (
    <div className={className} dir="rtl">
      {(isLoading || hasAvailableData) && (
        <DataTableToolbar
          table={table}
          searches={searches}
          searchValue={searchValue}
          filters={filters}
          showColumnVisibilityToggle={false}
          showMobileSortDropdown={false}
          isLoading={isLoading}
          onSearchChange={onSearchChange}
        />
      )}

      {isLoading ? (
        <DataCardsSkeleton
          count={effectiveLoadingRowsCount}
          gridClassName={gridClassName}
        />
      ) : table.getRowModel().rows?.length ? (
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
            gridClassName,
          )}
        >
          {table.getRowModel().rows.map((row, i) => (
            <React.Fragment key={row.id}>
              {renderCard(row.original, i)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-[1.6rem] text-gray-500">
          لا توجد نتائج
        </div>
      )}

      <DataTablePagination
        table={table}
        onNext={paginationOptions?.onNext}
        onPrevious={paginationOptions?.onPrevious}
        onPageChange={paginationOptions?.onPageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
