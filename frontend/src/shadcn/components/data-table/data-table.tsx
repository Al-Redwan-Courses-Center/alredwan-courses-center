"use client";

import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableMobileView } from "./data-table-mobile";
import { DataTableRowsSkeleton } from "./data-table-skeletons";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableProps } from "./types";
import React, { useState } from "react";

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "ابحث عن دورة أو محاضرة",
  mobileConfig,
  pageSize = 7,
  className,
  filters = [],
  showMobileSortDropdown = false,
  showColumnVisibilityToggle = false,
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
}: DataTableProps<TData, TValue>) {
  const [localSorting, setLocalSorting] = useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [localPagination, setLocalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

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
    onRowSelectionChange: setRowSelection,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  const effectiveLoadingRowsCount = loadingRowsCount ?? pageSize;
  const searchValue =
    remoteState?.searchValue ??
    (searchKey
      ? (table.getColumn(searchKey)?.getFilterValue() as string)
      : "") ??
    "";

  return (
    <div className={className} dir="rtl">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        filters={filters}
        showColumnVisibilityToggle={showColumnVisibilityToggle}
        showMobileSortDropdown={showMobileSortDropdown}
        isLoading={isLoading}
        onSearchChange={onSearchChange}
      />

      <div className="tablet:hidden">
        <div className="shadow-soft overflow-hidden rounded-[1.2rem]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-olive-200/70 hover:bg-olive-200/70 border-none"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <TableHead
                        key={header.id}
                        className="py-5 text-center text-[1.5rem] font-bold text-gray-800 select-none"
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        style={canSort ? { cursor: "pointer" } : {}}
                      >
                        <span className="inline-flex items-center justify-center gap-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {canSort && (
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-150 ${
                                header.column.getIsSorted() === "asc"
                                  ? "rotate-180"
                                  : ""
                              } ${
                                !header.column.getIsSorted()
                                  ? "opacity-50"
                                  : "opacity-100"
                              }`}
                            />
                          )}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <DataTableRowsSkeleton
                  rowsCount={effectiveLoadingRowsCount}
                  columnsCount={columns.length}
                />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`data-[state=selected]:bg-olive-100/40 hover:bg-olive-50/50 border-b border-gray-100 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-4 text-center text-[1.45rem] text-gray-800"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-[1.6rem] text-gray-500"
                  >
                    لا توجد نتائج
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="tablet:block hidden">
        <DataTableMobileView
          table={table}
          mobileConfig={mobileConfig}
          isLoading={isLoading}
          loadingRowsCount={effectiveLoadingRowsCount}
        />
      </div>

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
