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
import { cn } from "@/lib/utils";
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
import { useState } from "react";

export function DataTable<TData, TValue>({
  columns,
  data,
  searches,
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
    const next = functionalUpdate(updater, sorting);
    if (!remoteState?.sorting) setLocalSorting(next);
    onSortingChange?.(next);
  };

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (
    updater,
  ) => {
    const next = functionalUpdate(updater, columnFilters);
    if (!remoteState?.columnFilters) setLocalColumnFilters(next);
    onFiltersChange?.(next);
  };

  const handlePaginationStateChange: OnChangeFn<PaginationState> = (
    updater,
  ) => {
    const next = functionalUpdate(updater, pagination);
    if (!isPageIndexControlled) {
      setLocalPagination(next);
    } else {
      setLocalPagination((prev) => ({ ...prev, pageSize: next.pageSize }));
    }
    onPaginationChange?.(next.pageIndex, next.pageSize);
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

  const firstSearchKey = searches?.[0]?.searchKey;
  const searchValue =
    remoteState?.searchValue ??
    (firstSearchKey
      ? (table.getColumn(firstSearchKey)?.getFilterValue() as string)
      : "") ??
    "";

  return (
    <div className={className} dir="rtl">
      <DataTableToolbar
        table={table}
        searches={searches}
        searchValue={searchValue}
        filters={filters}
        showColumnVisibilityToggle={showColumnVisibilityToggle}
        showMobileSortDropdown={showMobileSortDropdown}
        isLoading={isLoading}
        onSearchChange={onSearchChange}
      />

      {/* ── Desktop table ── */}
      <div className="tablet:hidden block">
        <Table className="border-separate border-spacing-y-[0.6rem]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="mb-4 border-none">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "bg-olive-100 h-17.5 border-none py-0 text-center text-[1.5rem] font-normal text-gray-500 select-none",
                        "first:rounded-tr-[20px] last:rounded-tl-[20px]",
                        canSort && "cursor-pointer",
                      )}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
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
                            className={cn(
                              "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-150",
                              header.column.getIsSorted() === "asc" &&
                                "rotate-180",
                              !header.column.getIsSorted() && "opacity-50",
                            )}
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
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group border-none drop-shadow-sm transition-all"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-[1.4rem] text-center text-[1.4rem] font-medium text-[#1F1F1F] transition-colors",
                        rowIndex % 2 === 0 ? "bg-gray-50" : "bg-gray-100",

                        "group-data-[state=selected]:bg-olive-50 group-hover:bg-gray-200/60",

                        rowIndex % 2 === 0
                          ? "first:rounded-br-[20px] last:rounded-bl-[20px]"
                          : "first:rounded-tr-[20px] last:rounded-tl-[20px]",
                      )}
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
              <TableRow className="border-none hover:bg-transparent">
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

      {/* ── Mobile accordion ── */}
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
