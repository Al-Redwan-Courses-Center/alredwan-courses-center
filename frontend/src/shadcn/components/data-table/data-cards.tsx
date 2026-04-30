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
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useMediaQuery } from "usehooks-ts";
import Loader from "@/components/ui/Loader";

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
  isFetchingMore = false,
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
  const isMobile = useMediaQuery("(max-width: 900px)");

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

  // TanStack Table intentionally returns unstable helper functions here.
  // eslint-disable-next-line react-hooks/incompatible-library
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

  const handleLoadMore = () => {
    if (!table.getCanNextPage()) return;

    const currentPage = table.getState().pagination.pageIndex;
    const nextPage = currentPage + 1;

    table.setPageIndex(nextPage);
    paginationOptions?.onNext?.(nextPage + 1, currentPage + 1);
    paginationOptions?.onPageChange?.(nextPage + 1, currentPage + 1);
  };

  const loadMoreRef = useIntersectionObserver({
    enabled:
      isMobile && table.getCanNextPage() && !isLoading && !isFetchingMore,
    onIntersect: handleLoadMore,
  });
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
        <>
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

          {isFetchingMore && (
            <div className="flex items-center justify-center py-6">
              <div className="h-10 w-10">
                <Loader />
              </div>
            </div>
          )}

          {isMobile && table.getCanNextPage() && !isFetchingMore && (
            <div ref={loadMoreRef} aria-hidden="true" className="h-px w-full" />
          )}
        </>
      ) : (
        <div className="py-24 text-center text-[1.6rem] text-gray-500">
          لا توجد نتائج
        </div>
      )}

      <div className="tablet:hidden block">
        <DataTablePagination
          table={table}
          onNext={paginationOptions?.onNext}
          onPrevious={paginationOptions?.onPrevious}
          onPageChange={paginationOptions?.onPageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
